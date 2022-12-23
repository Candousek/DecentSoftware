require('dotenv').config();
const { GClient, Plugins, Component } = require('gcommands');
const { GatewayIntentBits } = require('discord.js');
const { join } = require('path');

Component.setDefaults({
	onError: (ctx, error) => {
		return ctx.reply('Oops! Something went wrong')
	} 
});

Plugins.search(__dirname);

const client = new GClient({
	dirs: [
		join(__dirname, 'commands'),
		join(__dirname, 'components'),
		join(__dirname, 'listeners')
	],
	messageSupport: true,
	messagePrefix: '!',
	devGuildId: process.env.DEV_SERVER,
	intents: Object.keys(GatewayIntentBits),
});

client.login(process.env.BOT_TOKEN);