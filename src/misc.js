/*
    misc.js
    Contains useful miscellaneous functions used throughout the bot.
*/
const fs = require('fs');
const request = null;
const destDms = 'dms';
const destAny = 'anywhere';
var uuid;
var _ = require('lodash');
try {
  uuid = require('uuid/v4');
} catch {
  uuid = require('uuid');
}

const ids = JSON.parse(fs.readFileSync('./info/ids.json', 'utf8'));
let mainGuild = null;

// Moderator and staff roles
let modRoles = JSON.parse(fs.readFileSync('./info/modRoles.json', 'utf8'));

// Bot reply emojis
let botReplies = JSON.parse(fs.readFileSync('./info/botReplies.json', 'utf8'));

function delay(t) {
  return new Promise(function (resolve) {
    setTimeout(resolve, t);
  });
}

function memberIsMod(member) {
  return true;
  let ret = false;
  for (let i = 0; i < modRoles.length; i++) {
    ret = ret || memberHasRole(member, modRoles[i]);
  }
  return ret;
}

function memberHasRole(member, role) {
  if (_.isNil(member) || _.isNil(member.roles)) {
    return false
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
  if (_.isNil(destination) || destination === 0 || _.isNil(message.guild) || memberIsMod(message.Author)) {
    return await message.channel.send(text);
  } else if (destination === destDms) {
    try {
      await message.author.send(text);
      return await message.delete();
    } catch (e) {
      return await message.channel.send(text);
    }
  }

  channel = message.guild.channels.cache.get(destination)
  if (_.isNil(channel) || channel.id === message.channel.id) {
    return await message.channel.send(text);
  }
  if (warn) {
    await channel.send(`*${message.author} please run this in ${channel} next time.*\n${text}`);
  } else {
    return await channel.send(text);
  }
  return await message.delete()

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
    url.indexOf('png', url.length - 'png'.length) != -1 ||
    url.indexOf('jpg', url.length - 'jpg'.length) != -1 ||
    url.indexOf('jpeg', url.length - 'jpeg'.length) != -1 ||
    url.indexOf('PNG', url.length - 'PNG'.length) != -1 ||
    url.indexOf('JPG', url.length - 'JPG'.length) != -1 ||
    url.indexOf('JPEG', url.length - 'JPEG'.length) != -1
  );
}

module.exports.delay = delay;
module.exports.memberIsMod = memberIsMod;
module.exports.memberHasRole = memberHasRole;
module.exports.ids = ids;
module.exports.botReply = botReply;
module.exports.mainGuild = mainGuild;
module.exports.fakeBan = fakeBan;
module.exports.sendToDestination = sendToDestination;
module.exports.destDms = destDms;
module.exports.destAny = destAny;
