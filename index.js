/*
	index.js
	Basic setup and core commands run on various actions (bot startup, messages, reactions
)*/

// Node imports
const fs = require("fs");
const Discord = require("discord.js");

// Run configuration
const config = require("./src/config.js");
config.configure();

// Local imports
const misc = require("./src/misc.js");
const blacklist = require("./src/blacklist.js");
const commands = require("./src/commands.js");
const reaction = require("./src/reaction.js");
const emojiCharacters = require('./src/emojiCharacters.js');

// Read in bot's Discord token
const discordToken = fs.readFileSync("./info/discordToken.txt", "utf8").replace("\n", "");

// Read in a given name and avatar for the bot
const botName = fs.readFileSync("./info/botName.txt", "utf8").replace("\n", "");

// Read in IDs from the ID file
const ids = JSON.parse(fs.readFileSync('./info/ids.json', 'utf8'));

// Spambot detection
let spambots = JSON.parse(fs.readFileSync("./info/spam.json", "utf8"));

// Auto assigned roles on new member join
let memberRoles = JSON.parse(fs.readFileSync("./info/memberRoles.json", "utf8"));

// Intro messages
let introMessages = JSON.parse(fs.readFileSync("./info/introMessages.json", "utf8"));

// Instance Data
const updateCacheEvery = 500;
let numMessages = 0;
let mainGuild = null;

// Create the bot
const TeddyBot = new Discord.Client({ 
	ws: { intents: new Discord.Intents(Discord.Intents.ALL)},
	partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

// Log into Discord using /info/DiscordToken.txt
console.log("Time to log in.");
TeddyBot.login(discordToken).catch(function (reason) {
	console.log(reason);
});

// Executed upon successful login
TeddyBot.on('ready', async () => {
	mainGuild = TeddyBot.guilds.cache.get(ids.server);
	misc.mainGuild = mainGuild;
	TeddyBot.setMaxListeners(0); // Ensure it responds to everything regardless of how busy the server gets
	await TeddyBot.user.setUsername(botName);
	//await TeddyBot.user.setAvatar("./img/avatar.png");
	await TeddyBot.user.setActivity("Type !help for commands");
	console.log(`${botName} is ready`);
});

// Executed upon a message being sent to any channel the bot can look at
TeddyBot.on('message', async message => {
	if (message.author.bot) return; //Ignore the bot's own messages
	
	let args = message.content.toLowerCase().split(" ");

	//Mod specific handlers:
	if (misc.memberIsMod(message)) {
		await commands.modCommands(message, args);
		await blacklist.handleBlacklistCommands(message, args);
	}

	// Check all messages for userCommands
	await commands.userCommands(message, args);

	// If someone asks the bot a question, reply with a canned response
	if (message.mentions.has(TeddyBot.user) && message.content[message.content.length - 1] == "?") {
		await misc.botReply(message, TeddyBot);
	}
	
	// Check for responses in an image-only channel
	if (message.channel == ids.galleryChannel) {
	    console.log('New message posted in gallery');
	    if (!(message.attachments.size > 0 && message.attachments.every(misc.attachIsImage))){
	      message.delete();
	      console.log(`Deleted non-image post from #gallery from ${message.author}`);
	    }
  	}

	//Handle blacklist removals/warnings
	let censored = await blacklist.handleBlacklist(message, TeddyBot.user.tag);
	if (!censored) {
		await blacklist.handleBlacklistPotential(message, TeddyBot.user.tag);
	}
});

// Executed upon a reaction being added to a message in the cache
TeddyBot.on("messageReactionAdd", async (messageReaction, user) => {
	await reaction.handleReactionAdd(messageReaction, user, TeddyBot);
});

//Executed upon a reaction being removed from a message in the cache
TeddyBot.on("messageReactionRemove", async (messageReaction, user) => {
	await reaction.handleReactionRemove(messageReaction, user, TeddyBot);
});


// Executed upon a new user joining the server
TeddyBot.on('guildMemberAdd', async(member) => {
	console.log("New member joined: " + member.displayName);
	let introductionsChannel = TeddyBot.channels.cache.get(ids.introductionsChannel);
	let rulesChannel = TeddyBot.channels.cache.get(ids.rulesChannel);
	var ran = Math.floor(Math.random() * introMessages.length);

	//Handle spambots and send intro messages
	var spam = false;
	for (let i = 0; i < spambots.length && !spam; i++){
		if (member.displayName.toLowerCase().includes(spambots[i])){
			console.log(`Kicking a spambot: ${member}`);
			member.send("Spambots are not welcome in this server. If you believe this was in error, remove the URL or spam phrase from your username before rejoining.");
			spam = true;
			await member.kick("Spambot eliminated");
		}
	}
	
	if (!spam){
		if(introductionsChannel != 0){
			// Send a custom intro if provided, otherwise send a Welcome. In both cases, let them know they'll get a member
			// role soon if the server uses these
			if (introMessages.length > 0){
				await introductionsChannel.send(`${introMessages[ran]} ${member} ! Be sure to read through ${rulesChannel}.`);
			} else {
				await introductionsChannel.send(`Welcome ${member} ! Be sure to read through ${rulesChannel}.`);
			}
			if (memberRoles.length > 0){
				await introductionsChannel.send("You'll be granted a member role very soon to access the rest of the server.");
			}
		}
		if(memberRoles.length > 0){
			setTimeout(() => {
				for (let i = 0; i < memberRoles.length; i++) {
					member.roles.add(member.guild.roles.cache.find(roles => roles.id === memberRoles[i]));
					console.log(`Assigned ${member} a member role`);
				}
			}, 60000) // 1 minute waiting period
		}
	}
});




