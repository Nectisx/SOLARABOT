// src/events/messageCreate.js
const logger = require('../utils/logger');
const { checkSpam } = require('../moderation/antiSpam');
const { addXp, refreshLeaderboardMessage } = require('../services/levelService');

const XP_PER_MESSAGE = 10;
const XP_COOLDOWN = new Map();

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // Anti-spam
    if (checkSpam(message)) {
      try {
        await message.delete().catch(() => {});
        const warn = await message.channel.send({ content: `⚠️ ${message.author}, ralentis ! Tu envoies trop de messages.` });
        setTimeout(() => warn.delete().catch(() => {}), 5000);
      } catch (err) {
        logger.warn(`Anti-spam: ${err.message}`);
      }
    }

    // XP (une fois par minute par utilisateur)
    const xpKey = `${message.guild.id}_${message.author.id}`;
    const now = Date.now();
    if (!XP_COOLDOWN.has(xpKey) || now - XP_COOLDOWN.get(xpKey) > 60000) {
      XP_COOLDOWN.set(xpKey, now);
      try {
        const { profile, leveledUp } = await addXp(message.guild.id, message.author.id, XP_PER_MESSAGE);
        if (leveledUp) {
          await message.channel.send({
            content: `🎉 Félicitations ${message.author} ! Tu es maintenant niveau **${profile.level}** !`,
          }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000)).catch(() => {});
        }
        // Mise à jour du classement live (debounce 2 min intégré dans levelService)
        refreshLeaderboardMessage(client, message.guild.id).catch(() => {});
      } catch (err) {
        logger.debug(`XP error: ${err.message}`);
      }
    }
  },
};
