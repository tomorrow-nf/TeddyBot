/*
    reaction.js
    Handles all things related to reactions and emoji.

    Written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server.
    Modified by Tyler "NFreak" Morrow for the CGCC Discord Server.
*/

const fs = require("fs");
const misc = require("./misc.js");

let removeReacts = true;
const emojiRoleDict = {
	"hitbox" : "Hit Box User",
	"smashbox" : "Smash Box User",
	"crossup" : "Cross|Up User"
}

function emojiToRole(emojiName, messageID) {
	let ret = emojiRoleDict[emojiName];
	return ret;
}

async function handleReactionAdd(messageReaction, user, DiscordBot) {
	if (messageReaction.message.channel.name == "role-assignment") {
		if (messageReaction.partial){
			try {
				await messageReaction.fetch();
				if (messageReaction.emoji.name == "gravy") {
					console.log("Received gravy react for role-assignment setup");
					//add role emotes
					removeReacts = false;
					let emojiNames = JSON.parse(fs.readFileSync("./info/roleEmoji.json", "utf8"));
					for (let i = 0; i < emojiNames.length; i++) {
						await messageReaction.message.react(DiscordBot.emojis.cache.find(emojis => emojis.name === emojiNames[i]));
					}
					messageReaction.remove; //remove the gravy emoji
					removeReacts = true;
				} else {
					console.log("Received something other than gravy, check if valid");
					let member = messageReaction.message.member;
					let hasRole = false;
					let newRole = emojiToRole(messageReaction.emoji.name, messageReaction.message.id);
					try {
						hasRole = member.roles.cache.some(role => role.name === newRole);
					} catch (error) {
						console.error(error);
					}

					let roleToAdd = messageReaction.message.member.guild.roles.cache.find(role => role.name === newRole);
					if (!hasRole) {
						console.log("Add role " + emojiToRole(messageReaction.emoji.name, messageReaction.message.id));
						member.roles.add(roleToAdd);
					} else {
						console.log("Remove role " + emojiToRole(messageReaction.emoji.name));
						member.roles.remove(roleToAdd);
					}

					if (removeReacts){
						messageReaction.remove; //as per desired behavior, remove their reaction after they add it
					}
					return;
				}
			} catch (error) {
				console.error(error);
			}
		}
	}
}

async function handleReactionRemove(messageReaction, user, DiscordBot) {
	return null;
}

module.exports.handleReactionAdd = handleReactionAdd;
module.exports.handleReactionRemove = handleReactionRemove;
