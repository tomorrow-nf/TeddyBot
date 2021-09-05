/*
    commands.js
    Handles comands, performing assorted responses to input.
*/

const fs = require("fs");
const misc = require("./misc.js");
const blacklist = require("./blacklist.js");
import { help as starHelp, handleCommand as starCommand } from "./stars";
const channels = JSON.parse(fs.readFileSync("./info/ids.json", "utf8"));
const helpDest = channels.helpChannel;
var _ = require("lodash");

let userCommandList = JSON.parse(
  fs.readFileSync("./info/userCommands.json", "utf8")
);
let userCommandDestinations;
generateUserCommandDestinations();

//Spambot detection
let spamlist = JSON.parse(fs.readFileSync("./info/spam.json", "utf8"));

let commandPrefix = "!";
let helpString = ["", ""];

// Hard-coded help strings for innate funtions
helpString[0] +=
  "`!members` - Tell us how many members are on a server, and how many are online.\n";
helpString[0] +=
  "`!top PLACEMENTS NUM_MESSAGES CHANNEL_NAME` - Tells you the top `PLACEMENTS` most frequent posters over the last `NUM_MESSAGES` messages in #`CHANNEL_NAME` (more messages = more time)\n";
helpString[0] +=
  "`!purge CHANNEL NUMBER` - Delete NUMBER messages from CHANNEL.\n";
helpString[0] +=
  "`!setcommand COMMAND_NAME text` - Will create a user-accessible =`COMMAND_NAME` that will make the bot return any text after `COMMAND_NAME`.\n";
helpString[0] +=
  "`!describecommand COMMAND_NAME description` - Adds a description to display in `!help` for the users.\n";
helpString[0] +=
  "`!removecommand COMMAND_NAME` - Will remove the user-accessible =`COMMAND_NAME`, if it exists.\n";
helpString[0] +=
  "`!hidecommand COMMAND_NAME` - Toggles visibility of a help command.\n";
helpString[0] +=
  "`!setcommanddest COMMAND_NAME DESTINATION` - Sets the destination channel of a command, leave this blank to clear, or use `dms` to send it to dms.\n";
helpString[0] +=
  "`!helpcount` - Show number of uses each user command has recieved.\n";
helpString[0] += "`!helphidden` - Display hidden user commands.\n";
helpString[0] +=
  "`!kill` - End this bot instance. Bot should automatically restart.\n";
helpString[0] += "`!say CHANNEL MESSAGE` - Send any message to any channel.\n";

helpString[1] +=
  "`!emotelist EMOTES` - The list of emotes to add to a message when reacting with a setup react.\n";
helpString[1] += "`!blacklist` - List all words currently on the blacklist.\n";
helpString[1] += "`!blacklist add word` - Add `word` to the blacklist.\n";
helpString[1] +=
  "`!blacklist remove word` - Remove `word` from the blacklist.\n";
helpString[1] +=
  "`!blacklist violations ID|Tag` - List all words that were removed as violations from a user with that ID or Tag.\n";
helpString[1] +=
  "`!blacklist warnings ID|Tag` - List all words that were flagged as warnings from a user with that ID or Tag.\n";
helpString[1] +=
  "`!log` - Print a log of all users with recorded blacklist warnings or infractions.\n";
helpString[1] +=
  "`!logfile` - Send a .csv file containing users and the quantity of violations/warnings.\n";
helpString[1] +=
  "`!spambots add word` - Add a string to the new user spambot filter\n";
helpString[1] +=
  "`!spambots remove word` - Remove a string from the spambot filter\n";
helpString[1] += "`!dmbot` - start a dm with HitBoxBot\n";
helpString[1] += starHelp();
async function modCommands(message, args) {
  if (args[0] == "!members") {
    let memberList = message.guild.members.cache.array();
    let memberCount = message.guild.memberCount;
    let onlineCount = 0;
    for (let i = 0; i < memberList.length; i++) {
      if (memberList[i].presence.status != "offline") onlineCount += 1;
    }
    return await message.channel.send(
      `${message.guild.name} currently has ${memberCount} total members. ${onlineCount} members are currently online.`
    );
  } else if (args[0] == "!top") {
    if (args.length < 4) {
      return await message.channel.send(
        "USAGE: `!top PLACEMENTS QUANTITY_MESSAGES CHANNEL_NAME` -- For Example `!top 5 10000 general` would return the Top 5 posters over the last 10000 messages in #general."
      );
    }
    let quantity_messages = 0;
    let relevant_channel = "";
    let placements = 0;
    try {
      placements = parseInt(args[1]);
      quantity_messages = parseInt(parseFloat(args[2]) / 100);
      if (quantity_messages < 1) quantity_messages = 1;
      if (args[3].startsWith("#")) {
        args[3] = args[3].substring(1);
      }
      relevant_channel = message.guild.channels.cache.find("name", args[3]);
      console.log(relevant_channel);
    } catch (e) {
      return await message.channel.send(e.message);
    }
    let resultsMessage = await message.channel.send("*Calculating...*");
    let msgArray = [];
    let before = "";
    for (let i = 0; i < quantity_messages; i++) {
      let options = { limit: 100 };
      if (before != "") options.before = before;

      let msgs = await relevant_channel.messages.fetch(options);
      msgs = msgs.array();
      msgArray = msgArray.concat(msgs);
      before = msgs[msgs.length - 1].id;
    }

    let dict = {};
    for (let i = 0; i < msgArray.length; i++) {
      if (msgArray[i].author.id in dict) {
        dict[msgArray[i].author.id][0] += 1;
      } else {
        dict[msgArray[i].author.id] = [];
        dict[msgArray[i].author.id][0] = 1;
        dict[msgArray[i].author.id][1] = msgArray[i].author.tag;
      }
    }
    let dictArray = [];
    for (let user in dict) {
      dictArray.push([user, dict[user][0], dict[user][1]]);
    }
    dictArray.sort(function (a, b) {
      return b[1] - a[1];
    });
    let str = `Top ${placements} #${args[3]} posters as of the last ${
      args[2]
    } messages, since ${msgArray[msgArray.length - 1].createdAt} :\n\n`;
    for (let i = 0; i < placements && i < dictArray.length; i++) {
      str += dictArray[i][2] + ": " + dictArray[i][1] + "\n";
    }
    console.log(str);
    return await resultsMessage.edit(str);
  } else if (args[0] == "!purge") {
    if (args.length < 3)
      return await message.channel.send(
        "USAGE: `!purge CHANNEL QUANTITY` -- example: `!purge general 100` will delete the last 100 messages in #general."
      );

    let relevant_channel = null;
    let quantity_messages = 0;
    try {
      if (args[1].startsWith("#")) args[1] = args[1].substring(1);
      quantity_messages = parseInt(args[2]);
      relevant_channel = message.guild.channels.cache.find(
        (channel) => channel.name === args[1]
      );
      console.log(
        "Received purge request for channel " +
          relevant_channel.name +
          ", " +
          quantity_messages +
          " messages"
      );
    } catch (e) {
      return await message.channel.send(e.message);
    }
    if (relevant_channel == null) {
      return await message.channel.send(
        "Could not find a channel with that name."
      );
    }
    let mChannel = message.channel;
    await message.delete();
    let msgArray = [];
    let before = "";
    for (let i = 0; i < quantity_messages; i++) {
      let options = { limit: 1 };
      let msgs = await relevant_channel.messages.fetch(options);
      msgs = msgs.array();
      for (let j = 0; j < msgs.length; j++) {
        await msgs[j].delete();
      }
    }
    return await mChannel.send(
      quantity_messages.toString() + " messages deleted from " + args[1] + "."
    );
  } else if (args[0] == "!modhelp") {
    let s = "Here are some commands available for moderators:\n\n";
    if (args.length == 1) s += helpString[0];
    else s += helpString[parseInt(args[1])];
    s += "`!help` - Commands for all users.\n";
    s += "Try `!modhelp 0` or `!modhelp 1` for more commands.";
    await message.channel.send(s);
  } else if (args[0] == "!logfile") {
    await message.channel.send({
      files: [
        {
          attachment: "./info/censorshipInfo.csv",
          name: "BlacklistLog.csv",
        },
      ],
    });
  } else if (args[0] == "!kill") {
    console.log("Received !kill command, restarting bot");
    await message.channel.send("Received !kill command, restarting bot");
    process.exit(1);
  } else if (args[0] == "!say") {
    if (args.length < 3) {
      return await message.channel.send(
        "USAGE: `!say CHANNEL MESSAGE` -- example: `!say general Hello world!`"
      );
    }
    let len = args[0].length + args[1].length + 2;
    if (args[1].startsWith("#")) {
      args[1] = args[1].substring(1);
    }
    let relevant_channel = null;
    try {
      relevant_channel = message.guild.channels.cache.find(
        (channel) => channel.name === args[1]
      );
    } catch (e) {
      return await message.channel.send(e.message);
    }
    if (relevant_channel == null) {
      return await message.channel.send(
        "I couldn't find a channel with that name."
      );
    }
    return await relevant_channel.send(message.content.substring(len));
  } else if (args[0] == "!setcommand" || args[0] == "!addcommand") {
    if (args.length < 3) {
      return await message.channel.send(
        "USAGE: `!setcommand COMMAND_NAME text` -- For example the command `!setcommand controllers Here's some useful controller info!` would create a command `!controllers` that would print `Here's some useful controller info!`."
      );
    } else {
      //first check if such a command already exists
      let exists = false;
      for (let i = 0; i < userCommandList.length; i++) {
        if (userCommandList[i].command == commandPrefix + args[1]) {
          //just update its text
          userCommandList[i].text = message.content.substring(
            args[0].length + args[1].length + 2
          );
          exists = true;
        }
      }

      if (!exists) {
        //add new command
        let toAdd = {
          command: commandPrefix + args[1],
          text: message.content.substring(args[0].length + args[1].length + 2),
          description: "",
        };
        userCommandList.push(toAdd);
      }

      generateUserCommandDestinations();
      fs.writeFileSync(
        "./info/userCommands.json",
        JSON.stringify(userCommandList, null, "\t"),
        "utf8"
      );
      let s = exists ? "Modified " : "Created ";
      return await message.channel.send(
        s + "the `" + commandPrefix + args[1] + "` command."
      );
    }
  } else if (
    args[0] == "!removecommand" ||
    args[0] == "!deletecommand" ||
    args[0] == "!delcommand"
  ) {
    if (args.length < 2) {
      return await message.channel.send(
        "USAGE: `!removecommand COMMAND_NAME` - For example `!removecommand controllers` would remove the `!controllers` command."
      );
    }

    for (let i = 0; i < userCommandList.length; i++) {
      if (userCommandList[i].command == commandPrefix + args[1]) {
        userCommandList.splice(i, 1);
      }
    }

    generateUserCommandDestinations();
    fs.writeFileSync(
      "./info/userCommands.json",
      JSON.stringify(userCommandList, null, "\t"),
      "utf8"
    );
    return await message.channel.send(
      "Removed `" + commandPrefix + args[1] + "`."
    );
  } else if (args[0] == "!describecommand") {
    if (args.length < 3) {
      return await message.channel.send(
        "USAGE: `!describecommand COMMAND_NAME description` - For example `!describecommand controllers Controller support info.` would set the description of `!controllers` to `Controller support info.`"
      );
    }

    //first find the relevant element index
    let index = -1;
    for (let i = 0; i < userCommandList.length; i++) {
      if (userCommandList[i].command == commandPrefix + args[1]) {
        index = i;
      }
    }

    if (index > -1) {
      userCommandList[index].description = message.content.substring(
        args[0].length + args[1].length + 2
      );
      generateUserCommandDestinations();
      fs.writeFileSync(
        "./info/userCommands.json",
        JSON.stringify(userCommandList, null, "\t"),
        "utf8"
      );
      return await message.channel.send(
        "Updated description of `" + commandPrefix + args[1] + "`."
      );
    } else {
      return await message.channel.send(
        "Could not find `" + commandPrefix + args[1] + "`."
      );
    }
  } else if (args[0] === "!setcommanddest") {
    let relevant_channel = null;
    if (args.length < 2)
      return await message.channel.send(
        "USAGE: `!setcommanddest COMMANDNAME DESTINATION` ie to have `!ping` run in `spam` type `!setcommanddest ping spam`, or in dms type `!setcommanddest ping dms` supply with no destination to clear."
      );
    if (args[1][0] == commandPrefix)
      //remove user-typed prefix if it exists
      args[1] = args[1].substring(1);
    let index = -1;
    for (let i = 0; i < userCommandList.length; i++) {
      if (userCommandList[i].command == commandPrefix + args[1]) index = i;
    }
    if (index != -1) {
      if (args.length == 2) {
        userCommandList[index].destination = "";
      } else if (args[2] == misc.destDms) {
        userCommandList[index].destination = misc.destDms;
      } else {
        if (args[2].startsWith("#")) {
          args[2] = args[2].substring(1);
        }
        try {
          relevant_channel = message.guild.channels.cache.find(
            (channel) => channel.name === args[2]
          );
        } catch (e) {
          return await message.channel.send(e.message);
        }
        if (relevant_channel == null) {
          return await message.channel.send(
            "I couldn't find a channel with that name."
          );
        }
        userCommandList[index].destination = relevant_channel.id;
      }
      generateUserCommandDestinations();
      fs.writeFileSync(
        "./info/userCommands.json",
        JSON.stringify(userCommandList, null, "\t"),
        "utf8"
      );

      return await message.channel.send(
        `Set \`${commandPrefix}${args[1]}\` to ${
          userCommandList[index].destination
            ? userCommandList[index].destination == misc.destDms
              ? "run in dms"
              : `run in ${relevant_channel}`
            : "run anywhere"
        }.`
      );
    } else {
      return await message.channel.send(
        "Could not find the command `" + commandPrefix + args[1] + "`."
      );
    }
  } else if (args[0] == "!hidecommand") {
    if (args.length < 2)
      return await message.channel.send(
        "USAGE: `!hidecommand COMMANDNAME` ie to hide the `!ping` command type `!hidecommand ping`."
      );
    if (args[1][0] == commandPrefix)
      //remove user-typed prefix if it exists
      args[1] = args[1].substring(1);
    let index = -1;
    for (let i = 0; i < userCommandList.length; i++) {
      if (userCommandList[i].command == commandPrefix + args[1]) index = i;
    }
    if (index != -1) {
      if (!userCommandList[index].hide) userCommandList[index].hide = true;
      else userCommandList[index].hide = false;
      generateUserCommandDestinations();
      fs.writeFileSync(
        "./info/userCommands.json",
        JSON.stringify(userCommandList, null, "\t"),
        "utf8"
      );
      return await message.channel.send(
        "Set `" +
          commandPrefix +
          args[1] +
          "` to " +
          (userCommandList[index].hide ? "hidden" : "visible") +
          "."
      );
    } else {
      return await message.channel.send(
        "Could not find the command `" + commandPrefix + args[1] + "`."
      );
    }
  } else if (args[0] == "!helpcount") {
    let s = "Command usage stats:\n";
    for (let i = 0; i < userCommandList.length; i++) {
      s +=
        "`" +
        userCommandList[i].command +
        "`: " +
        (userCommandList[i].count ? userCommandList[i].count.toString() : "0") +
        "\n";
    }
    return await message.channel.send(s);
  } else if (args[0] == "!helphidden") {
    let s = "Hidden help commands:\n";
    for (let i = 0; i < userCommandList.length; i++) {
      if (userCommandList[i].hide) {
        s += "`" + userCommandList[i].command + "`\n";
      }
    }
    return await message.channel.send(s);

    // Spambot list control commands
  } else if (args[0] == "!spambots") {
    if (args.length == 1) {
      let str = "Words on the spambot filter: \n`";
      for (let i = 0; i < spamlist.length; i++) {
        str += spamlist[i] + "\n";
      }
      str += "`";
      return await message.channel.send(str);
    } else if (args.length > 1 && args[1] == "add") {
      if (args.length > 2) {
        spamlist.push(args[2]);
        fs.writeFileSync("./info/spam.json", JSON.stringify(spamlist), "utf8");
        await message.channel.send(
          "`" + args[2] + "` has been added to the spamlist."
        );
      } else {
        await message.channel.send("Usage: `!spamlist add word`");
      }
    } else if (args.length > 1 && args[1] == "remove") {
      if (args.length > 2) {
        let ind = spamlist.indexOf(args[2]);
        if (ind > -1) {
          spamlist.splice(ind, 1);
          fs.writeFileSync(
            "./info/spam.json",
            JSON.stringify(spamlist),
            "utf8"
          );
          await message.channel.send(
            "`" + args[2] + "` has been removed from the spamlist."
          );
        } else {
          await message.channel.send(
            "`" + args[2] + "` was not found in the spamlist."
          );
        }
      } else {
        await message.channel.send("Usage: `!spamlist remove word`");
      }
    }
  } else if (args[0] === "!meme") {
    if (
      misc.ids.memesChannel != "0" &&
      message.channel.id == misc.ids.memesChannel
    ) {
      fs.readdir("./img/memes/", (err, files) => {
        var num;
        if (args.length === 2) {
          num = args[1];
        } else {
          num = Math.floor(Math.random() * files.length);
        }
        console.log(
          "Fetching meme #" + num + ", Number of files: " + files.length
        );
        return message.channel.send({
          files: [
            {
              attachment: "./img/memes/meme" + num + ".png",
              name: "meme" + num + ".png",
            },
          ],
        });
      });
    }
  } else if (args[0] === "!dmbot") {
    return message.author.send("hi");
  }
  starCommand(message, args);
}
function generateUserCommandDestinations() {
  const destinations = new Map();
  userCommandList.forEach((cmd) => {
    if (cmd.hide) {
      return;
    }
    const dest = cmd.destination;
    if (dest == misc.destDms) {
      if (_.isEmpty(destinations[dest])) {
        destinations[dest] = [];
      }
      destinations[dest].push(cmd);
      return;
    }
    if (!dest || dest === 0 || dest === "") {
      if (_.isEmpty(destinations[misc.destAny])) {
        destinations[misc.destAny] = [];
      }
      destinations[misc.destAny].push(cmd);
      return;
    }
    if (_.isEmpty(destinations[dest])) {
      destinations[dest] = [];
    }
    destinations[dest].push(cmd);
  });
  userCommandDestinations = destinations;
}

async function userCommands(message, args) {
  if (args[0] == "!help") {
    let userHelpString = "";

    const generateCommandText = (cmd) => {
      userHelpString += "`" + cmd.command + "` -  " + cmd.description + "\n";
    };

    if (!_.isEmpty(userCommandDestinations[misc.destAny])) {
      userHelpString += "__*Use these commands anywhere:*__\n";
      _.forEach(userCommandDestinations[misc.destAny], generateCommandText);
    }

    if (!_.isEmpty(userCommandDestinations[misc.destDms])) {
      userHelpString += "__*Use these commands in your dms:*__\n";
      _.forEach(userCommandDestinations[misc.destDms], generateCommandText);
    }

    _.forEach(userCommandDestinations, (cmds, dest) => {
      if (dest === misc.destDms || dest === misc.destAny) {
        return;
      }
      userHelpString += `__*Use these commands in <#${dest}>:*__\n`;
      _.forEach(cmds, generateCommandText);
    });
    return await misc.sendToDestination(
      message,
      helpDest,
      `**Here's a list of commands for all users:**\n${userHelpString}`
    );
  } else if (args[0].startsWith(commandPrefix)) {
    for (let i = 0; i < userCommandList.length; i++) {
      //check through all defined userCommands
      if (args[0] == userCommandList[i].command) {
        if (!userCommandList[i].count) userCommandList[i].count = 0;
        userCommandList[i].count += 1;
        fs.writeFileSync(
          "./info/userCommands.json",
          JSON.stringify(userCommandList, null, "\t"),
          "utf8"
        );
        misc.sendToDestination(
          message,
          userCommandList[i].destination,
          userCommandList[i].text,
          true
        );
      }
    }
  }
}

module.exports.modCommands = modCommands;
module.exports.userCommands = userCommands;
