// src/events/ready.js
const { REST, Routes, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

async function deployCommands(client) {
  const commands = [];
  const commandsPath = path.join(__dirname, '..', 'commands');

  function loadDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        loadDir(full);
      } else if (entry.name.endsWith('.js') && entry.name !== 'deploy.js') {
        try {
          const cmd = require(full);
          if (cmd.data) commands.push(cmd.data.toJSON());
        } catch (err) {
          logger.warn(`Commande ignorée (${entry.name}): ${err.message}`);
        }
      }
    }
  }

  loadDir(commandsPath);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const clientId = client.application.id;
  const guildId = process.env.GUILD_ID;

  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      logger.info(`✅ ${commands.length} commande(s) déployée(s) sur le serveur (instantané)`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      logger.info(`✅ ${commands.length} commande(s) déployée(s) globalement`);
    }
  } catch (err) {
    logger.error(`❌ Erreur déploiement commandes: ${err.message}`);
  }
}

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`✅ Bot connecté en tant que ${client.user.tag}`);
    logger.info(`📡 Sur ${client.guilds.cache.size} serveur(s)`);

    client.user.setActivity('PLAY.WESTSKY.FR', { type: ActivityType.Playing });

    // Renommer le bot et mettre à jour la bio si nécessaire
    if (client.user.username !== 'WestSky') {
      client.user.setUsername('WestSky').catch(err => logger.warn(`Rename bot: ${err.message}`));
    }

    // Déploiement automatique des slash commands
    await deployCommands(client);

    if (client.giveawayManager) {
      await client.giveawayManager.restoreActiveGiveaways();
    }
    if (client.inviteTracker) {
      await client.inviteTracker.init();
    }

    // Restaurer les expulsions temporaires actives / expirées pendant l'arrêt
    const { restoreActiveTempBans } = require('../services/tempBanService');
    await restoreActiveTempBans(client);
  },
};
