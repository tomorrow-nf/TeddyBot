/*
    reaction.js
    Handles all things related to reactions and emoji.

    Written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server.
    Modified by Tyler "NFreak" Morrow for the CGCC Discord Server.
*/

const fs = require("fs");
const misc = require("./misc.js");

let emojiSets = JSON.parse(fs.readFileSync("./info/roleEmoji.json", "utf8"));

async function handleReactionAdd(reaction, user, TeddyBot) {
	if (reaction.message.channel == ids.roleChannel) {
		if (reaction.partial){
			for (let i = 0; i < emojiSets.length; i++){
				try {
					await reaction.fetch();
					if (emojiSets[i] == 0) {
						console.log("Received a setup react for role assignment");
						let setNumber = emojiSets[i].set;
						// Loop through again to add reacts for setup
						for (let j = 0; j < emojiSets.length; j++) {
							if (emojiSets[j].set == setNumber && emojiSets[j].role != "0"){
								await reaction.message.react(TeddyBot.emojis.cache.find(emojis => emojis.id === emojiSets[j]));
							}
						}
						reaction.remove; //remove the setup emoji
					} else {
						console.log("Received something other than setup react, check if valid");
						if (reaction.emoji.id != emojiSets[i]){
							// Do nothing. Keep looping though to find this emote. If never found, nothing will happen
						}
						else {
							let hasRole = misc.memberHasRole(user, emojiSets[i]);

							if (!hasRole) {
								console.log(`Add role ${emojiSets[i]} to user ${user}`);
								user.roles.add(roleToAdd);
							} else {
								console.log("Remove role " + emojiToRole(reaction.emoji.name));
								user.roles.remove(roleToAdd);
							}
						}
						reaction.remove; // Remove their reaction after they add it to clean up
					}
				} catch (error) {
					console.error(error);
				}
			}
		}
	}
}

async function handleReactionRemove(reaction, user, TeddyBot) {
	// Nothing to do
	return null;
}

module.exports.handleReactionAdd = handleReactionAdd;
module.exports.handleReactionRemove = handleReactionRemove;
