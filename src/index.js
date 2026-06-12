// src/index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const logger = require('./utils/logger');
const { loadCommands, loadEvents } = require('./utils/commandLoader');
const GiveawayManager = require('./giveaways/GiveawayManager');
const InviteTracker = require('./invites/InviteTracker');
const { token } = require('./config/config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.Reaction],
});

client.commands = new Collection();

client.giveawayManager = new GiveawayManager(client);
client.inviteTracker = new InviteTracker(client);

loadCommands(client);
loadEvents(client);

process.on('unhandledRejection', (reason) => {
  logger.error(`Rejet non géré: ${reason?.message || reason}`);
});
process.on('uncaughtException', (err) => {
  logger.error(`Exception non capturée: ${err.message}`);
  process.exit(1);
});

client.login(token).catch(err => {
  logger.error(`Impossible de se connecter: ${err.message}`);
  process.exit(1);
});
