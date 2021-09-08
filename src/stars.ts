import {
  addMilliseconds,
  addSeconds,
  Duration,
  isAfter,
  startOfMinute,
} from "date-fns";
import { id } from "date-fns/locale";
import { Message, MessageReaction, User } from "discord.js";
import * as fs from "fs";
import { get, has, set, sortBy, unset } from "lodash";
import parse from "parse-duration";
import { memberIsMod } from "./misc";
import { formatDuration } from "date-fns";
const cmdName = "!starTracker";

type PostStars = Map<string, number>;
type StarConfig = {
  id: string;
  total: number;
  posts: PostStars;
};
type StarMap = Map<string, StarConfig>;
type Config = {
  periodStart: number | Date;
  duration?: Duration;
  current: StarMap;
  previous: StarMap;
  emoteId: string;
};
const cfgFile = "./info/stars.json";
const defaultConfig: Config = {
  emoteId: "",
  periodStart: NaN,
  duration: undefined,
  current: new Map(),
  previous: new Map(),
};
let currentConfig: Config = defaultConfig;

const writeConfig = () => {
  const cfg = currentConfig;
  fs.writeFileSync(cfgFile, JSON.stringify(cfg), "utf-8");
};

const readConfig = () => {
  const cfg: Config = JSON.parse(fs.readFileSync(cfgFile).toString());
  currentConfig = cfg;
};
export const loadConfig = () => {
  if (!fs.existsSync(cfgFile)) {
    writeConfig();
    return true;
  }
  readConfig();
  return false;
};
const periodEnd = (cfg: Config) =>
  addSeconds(cfg.periodStart, get(cfg, "duration.seconds", 0));

const rollover = (now: number, duration: Duration | undefined = undefined) => {
  const cfg = currentConfig;
  if (duration && duration != cfg.duration) {
    cfg.duration = get(duration, "seconds", 0) > 0 ? duration : undefined;
  }

  if (!get(cfg, "duration")) {
    currentConfig.duration = undefined;
    writeConfig();
    return;
  } else {
    writeConfig();
  }

  if (
    !get(cfg, "periodStart") ||
    (duration && duration != cfg.duration) ||
    isAfter(now, periodEnd(cfg))
  ) {
    currentConfig = {
      ...cfg,
      periodStart: now,
      previous: cfg.current,
      current: new Map(),
    };
    writeConfig();
  }
};

export const handleReactionAdd = async (
  reaction: MessageReaction,
  user: User
) => {
  if (reaction.partial) {
    await reaction.fetch();
  }
  if (get(reaction, "emoji.id") != currentConfig.emoteId) return;
  if (get(reaction, "message.author.id") == user.id) return;
  if (!get(currentConfig, "duration")) return;
  if (!reaction.message.guild) return;
  if (
    memberIsMod(
      reaction.message.guild.members.cache.get(reaction.message.author.id)
    )
  )
    return;

  const now = Date.now();
  rollover(now);
  const cfg = get(currentConfig.current, reaction.message.author.id, {
    id: reaction.message.author.id,
    total: 0,
    posts: new Map(),
  });
  cfg.total += 1;
  const count = get(cfg.posts, reaction.message.id);
  set(cfg.posts, reaction.message.id, count ? count + 1 : 1);

  set(currentConfig.current, reaction.message.author.id, cfg);
  writeConfig();
};
export const handleReactionRemove = async (
  reaction: MessageReaction,
  user: User
) => {
  if (reaction.partial) {
    await reaction.fetch();
  }
  if (get(reaction, "emoji.id") != currentConfig.emoteId) return;
  if (get(reaction, "message.author.id") == user.id) return;
  if (!get(currentConfig, "duration")) return;
  if (!reaction.message.guild) return;
  if (
    memberIsMod(
      reaction.message.guild.members.cache.get(reaction.message.author.id)
    )
  )
    return;
  const now = Date.now();
  rollover(now);

  const cfg = get(currentConfig.current, reaction.message.author.id);
  if (!cfg) return;

  const count = get(cfg.posts, reaction.message.id);
  if (!count || count == 0) return;

  if (cfg.total <= 1) {
    unset(currentConfig.current, reaction.message.author.id);
    writeConfig();
    return;
  }

  count == 1
    ? unset(cfg.posts, reaction.message.id)
    : set(cfg.posts, reaction.message.id, count - 1);
  cfg.total -= 1;

  set(currentConfig.current, reaction.message.author.id, cfg);
  writeConfig();
};

export const help = (): string => {
  return (
    ` ${cmdName} duration - accepts an optional duration of time, or the keyword disable, it will handle pretty much any duration format you throw at it so long as it has units\n` +
    ` ${cmdName} stats - accepts an optional specifier [current,previous] to select whether to display the current or previous round of stars, as well as an optional integer limit (default is 10)\n`
  );
};

const invalidArgs = async (message: Message) => {
  await message.channel.send(
    `Invalid arguments for ${cmdName}.\nUSAGE:\n${help()}`
  );
};

const sendStats = async (
  message: Message,
  current: boolean = true,
  limit: number = 10
) => {
  const counts = sortBy(
    current ? currentConfig.current : currentConfig.previous,
    ["count"]
  );
  let stats = `***These are the ${
    current ? "current" : "previous"
  } top ${limit} star counts:***\n`;

  let i = 0;
  counts.slice(0, limit).forEach((data: any) => {
    const cfg: StarConfig = data;

    const name = message.guild
      ? get(message.guild.members.cache.get(cfg.id), "user.username")
      : cfg.id;
    stats += `${i + 1}.) \`${name}\`: ${cfg.total} star${
      cfg.total > 1 ? "s" : ""
    }`;
    i++;
  });
  await message.channel.send(stats);
};

const getPrettyDuration = () => {
  let seconds: any = get(currentConfig.duration, "seconds", 0);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
  const hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  const mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  const sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
};
export const handleCommand = async (
  message: Message,
  args: string[]
): Promise<boolean> => {
  if (!memberIsMod(message.member)) return false;
  if (get(args, "[0]", "") != cmdName.toLowerCase()) return false;
  const cmd = get(args, "[1]", "");
  const nargs = args.slice(2);
  switch (cmd) {
    case "duration": {
      if (nargs.length == 0) {
        await message.channel.send(
          currentConfig.duration
            ? `star tracking enabled with current rollover duration: ${getPrettyDuration()}`
            : "star tracking disabled"
        );
        return true;
      } else if (nargs.length == 1 && nargs[0] == "disable") {
        rollover(Date.now(), {});
        return true;
      }
      const seconds = parse(nargs.join(" "), "s");
      if (!seconds || seconds <= 0) {
        break;
      }
      rollover(Date.now(), { seconds });

      await message.channel.send(
        currentConfig.duration
          ? `star tracking enabled with current rollover duration: ${getPrettyDuration()}`
          : "star tracking disabled"
      );
      return true;
    }
    case "stats": {
      if (nargs.length == 0) {
        sendStats(message);
        return true;
      }
      const cmd = get(nargs, "[0]", "");
      if (nargs.length != 2 && cmd != "previous" && cmd != "current") {
        break;
      }

      const current = cmd == "current";
      const limit = get(nargs, "[1]", 10);
      await sendStats(message, current, limit);
      return true;
    }
  }
  await invalidArgs(message);
  return false;
};
