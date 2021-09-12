/*
    misc.js
    Contains useful miscellaneous functions used throughout the bot.
*/
import { readFileSync } from "fs";
const request = null;
const destDms = "dms";
const destAny = "anywhere";
var uuid;
import { isNil } from "lodash";
try {
  uuid = require("uuid/v4");
} catch {
  uuid = require("uuid");
}

const ids = JSON.parse(readFileSync("./info/ids.json", "utf8"));
let mainGuild = null;

// Moderator and staff roles
let modRoles = JSON.parse(readFileSync("./info/modRoles.json", "utf8"));

// Bot reply emojis
let botReplies = JSON.parse(readFileSync("./info/botReplies.json", "utf8"));

function delay(t) {
  return new Promise(function (resolve) {
    setTimeout(resolve, t);
  });
}

function memberIsMod(member) {
  if (process.env.OVERRIDE_MOD) return false;
  let ret = false;
  for (let i = 0; i < modRoles.length; i++) {
    ret = ret || memberHasRole(member, modRoles[i]);
  }
  return ret;
}

function memberHasRole(member, role) {
  if (isNil(member) || isNil(member.roles)) {
    return false;
  }
  return member.roles.cache.some((roles) => roles.id === role);
}

async function botReply(message, DiscordBot) {
  let ran = Math.floor(Math.random() * 10);
  let emote = DiscordBot.emojis.cache.find(
    (emojis) => emojis.id === botReplies[ran]
  );
  return await message.channel.send(emote.toString());
}

async function sendToDestination(message, destination, text, warn = false) {
  if (
    isNil(destination) ||
    destination === 0 ||
    isNil(message.guild) ||
    memberIsMod(message.member)
  ) {
    return await message.channel.send(text);
  } else if (destination === destDms) {
    let msg = text;
    if (warn) {
      msg = `*${message.author} please run this in your dms next time.*\n${text}`;
    }
    try {
      await message.author.send(msg);
      try {
        return await message.delete();
      } catch (e) {
        console.error(e);
        return;
      }
    } catch (e) {
      return await message.channel.send(msg);
    }
  } else {
    const channel = message.guild.channels.cache.get(destination);
    if (isNil(channel) || channel.id === message.channel.id) {
      return await message.channel.send(text);
    }

    if (warn) {
      await channel.send(
        `*${message.author} please run this in ${channel} next time.*\n${text}`
      );
    } else {
      return await channel.send(text);
    }
    return await message.delete();
  }
}

async function fakeBan(message, DiscordBot) {
  if (message.mentions.everyone || !message.mentions.has(DiscordBot)) {
    return;
  }

  return await message.channel.send(
    `*User <@${message.author.id}> Has Been Banned For This Post*`
  );
}

function attachIsImage(msgAttach) {
  let url = msgAttach.url;
  //True if this url is a PNG or JPG image. Kind of hacky to ignore case
  return (
    url.indexOf("png", url.length - "png".length) != -1 ||
    url.indexOf("jpg", url.length - "jpg".length) != -1 ||
    url.indexOf("jpeg", url.length - "jpeg".length) != -1 ||
    url.indexOf("PNG", url.length - "PNG".length) != -1 ||
    url.indexOf("JPG", url.length - "JPG".length) != -1 ||
    url.indexOf("JPEG", url.length - "JPEG".length) != -1
  );
}

const _delay = delay;
export { _delay as delay };
const _memberIsMod = memberIsMod;
export { _memberIsMod as memberIsMod };
const _memberHasRole = memberHasRole;
export { _memberHasRole as memberHasRole };
const _ids = ids;
export { _ids as ids };
const _botReply = botReply;
export { _botReply as botReply };
const _mainGuild = mainGuild;
export { _mainGuild as mainGuild };
const _fakeBan = fakeBan;
export { _fakeBan as fakeBan };
const _sendToDestination = sendToDestination;
export { _sendToDestination as sendToDestination };
const _destDms = destDms;
export { _destDms as destDms };
const _destAny = destAny;
export { _destAny as destAny };
