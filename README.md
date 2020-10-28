# TeddyBot
A basic Discord bot providing basic quality of life improvements to any server.

## How does it work?
TeddyBot is a Discord Bot powered by [discord.js](https://discord.js.org/). The Bot is being regularly maintained and updated to meet the needs of the growing community, and supports things like automatic role distribution, removal of messages with harmful content, server usage information, and more.

## Features
* Automatic role handling (member roles on join, reactions for role assignment)
* Dynamic text commands (Any mod can create a command that will return text that is available to all users)
* Channel cleanup
* Simple spambot filtering
* Image reactions
* and other small improvements

## Usage
TeddyBot is structured to be easily configurable for any server by editing several JSON files. This bot assumes you know how to obtain Discord IDs for your server, channels, and roles.

/src/config.js will run upon running the bot, and will create the files you'll need to get it up and running. These must be populated appropriately, especially discordToken.txt.

If you do not want server member introductions, set "introductions-channel" to 0.
If you want to share moderation and bot-log channels in a single channel, set "botlog-channel" to 0.
Only use as many role-messageX IDs as need be (i.e. if you have 2 "sets" of roles, like a game character main and pronouns, you can set these to two separate messages for users to react to)

## Credits
TeddyBot was forked from Gifkin, and reworked and maintained by NFreak.

Gifkin was originally written by Adam "WaveParadigm" Gincel, for the now defunct Icons Discord Server.
