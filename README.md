# HitBoxBot
A basic Discord bot providing basic quality of life improvements to the official Hit Box Discord server.

## How does it work?
HitBoxBot is a Discord Bot powered by [discord.js](https://discord.js.org/). The Bot is being regularly maintained and updated to meet the needs of the growing community, and supports things like automatic role distribution, removal of messages with harmful content, server usage information, and more.

## Features
* Automatic role handling (member roles on join, reactions for role assignment)
* Dynamic text commands (Any mod can create a command that will return text that is available to all users)
* Channel cleanup
* Simple spambot filtering
* Image reactions
* and other small improvements

## Usage
HitBoxBot is structured to be easily configurable for any server by editing several JSON files. As well, it can be forked and modified per server for even deeper customization. This bot assumes you know how to obtain Discord IDs for your server, channels, and roles.

/src/config.js will run upon running the bot, and will create the files you'll need to get it up and running. These must be populated appropriately, especially discordToken.txt.

If you do not want server member introductions, set "introductionsChannel" to 0.
If you want to share moderation and bot-log channels in a single channel, set "botlogChannel" to 0.
If you do not want a meme channel to dump random images with the !meme command, set "memeChannel" to 0.
If you do not have an "images only" channel, set "galleryChannel" to 0.

## Role Assignment
HitBoxBot supports emote reaction role assignment via info/roleEmoji.json. This file must contain a list of emote IDs and their corresponding role IDs, and which "set" they correspond to.
If a list entry has "role" = 0, it is assumed to be a setup emote for the corresponding "set". Reacting to a post in your roleChannel with this emote will apply the rest of the emotes for role assignment.

## Requirements
NodeJS 12+
Discord.js 12+

## Credits
HitBoxBot was forked from Gifkin, and reworked and maintained by NFreak.

Gifkin was originally written by Adam "WaveParadigm" Gincel, for the now defunct Icons Discord Server.
