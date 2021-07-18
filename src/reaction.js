/*
    reaction.js
    Handles all things related to reactions and emoji.

    Written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server.
    Modified by Tyler "NFreak" Morrow for the CGCC Discord Server.
*/

const fs = require("fs");
const misc = require("./misc.js");
const _ = require("lodash");

let emojiSets = JSON.parse(fs.readFileSync("./info/roleEmoji.json", "utf8"));

let removeReacts = true;

async function handleReactionAdd(reaction, user, TeddyBot) {
  if (user.bot) return;
  if (reaction.message.channel == misc.ids.rolesChannel) {
    if (reaction.partial) {
      await reaction.fetch();
    }
    for (let i = 0; i < emojiSets.length; i++) {
      if (reaction.emoji.id == emojiSets[i].emote) {
        console.log(`Found ${reaction.emoji.id} in the json file`);
        if (emojiSets[i].role == 0) {
          console.log("Received a setup react for role assignment");
          removeReacts = false;
          let setNumber = emojiSets[i].set;
          // Loop through again to add reacts for setup
          for (let j = 0; j < emojiSets.length; j++) {
            if (emojiSets[j].role != "0" && emojiSets[j].set == setNumber) {
              emojiSets[j].msgId = reaction.message.id
            }
            if (emojiSets[j].set == setNumber && emojiSets[j].role != "0") {
              await reaction.message.react(`${TeddyBot.emojis.cache.find(emojis => emojis.id === emojiSets[j].emote)}`);
            }
          }

          fs.writeFileSync(
            './info/roleEmoji.json',
            JSON.stringify(emojiSets, null, '\t'),
            'utf8'
          );

          console.log(`Removing setup react from ${reaction.message.member}`);
          await reaction.remove(user); // Remove their reaction after they add it to clean up
          removeReacts = true;
        } else {
          console.log("Received something other than setup react, check if valid");
          let guild = reaction.message.member.guild;
          const msgId = _.get(emojiSets[i], 'msgId')
          if (reaction.emoji.id != emojiSets[i].emote || (msgId && reaction.message.id != msgId)) {
            // should fix cgcc....
            // Do nothing. Keep looping though to find this emote. If never found, nothing will happen
          }
          else {
            let hasRole = misc.memberHasRole(guild.member(user), emojiSets[i].role);

            if (!hasRole) {
              console.log(`Add role ${emojiSets[i].role} to user ${user}`);
              guild.member(user).roles.add(emojiSets[i].role);
            } else {
              console.log(`Remove role ${emojiSets[i].role} from user ${user}`);
              guild.member(user).roles.remove(emojiSets[i].role);
            }
          }
          if (removeReacts) {
            console.log(`Removing user react from ${guild.member(user)}`);
            await reaction.users.remove(user); // Remove their reaction after they add it to clean up
          }
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
