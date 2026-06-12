// src/events/messageCreate.js
const logger = require('../utils/logger');
const { checkSpam } = require('../moderation/antiSpam');
const { checkAntiPub, checkAntiInsult, isBypassed, applyAutoMute } = require('../moderation/automod');
const { addXp, refreshLeaderboardMessage } = require('../services/levelService');
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../config/constants');
const prisma = require('../database/prisma');

const XP_PER_MESSAGE = 10;
const XP_COOLDOWN = new Map();

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // ── AutoMod ────────────────────────────────────────────────────
    // Anti-pub (prioritaire — si pub détectée, on s'arrête là)
    if (await checkAntiPub(message)) return;

    // Anti-insulte
    if (await checkAntiInsult(message)) return;

    // Anti-spam : si spam détecté et membre non bypassé → mute 5 min
    if (checkSpam(message)) {
      try {
        if (!(await isBypassed(message))) {
          await message.delete().catch(() => {});
          await applyAutoMute(message, 'Spam de messages');
          const warn = await message.channel.send({
            content: `⚠️ ${message.author}, tu envoies trop de messages ! Tu as été mis en sourdine **5 minutes**.`,
          }).catch(() => null);
          if (warn) setTimeout(() => warn.delete().catch(() => {}), 8000);
          return;
        } else {
          // Bypass : supprime juste le message spam sans muter
          await message.delete().catch(() => {});
        }
      } catch (err) {
        logger.warn(`Anti-spam: ${err.message}`);
      }
    }

    // ── XP (une fois par minute par utilisateur) ───────────────────
    const xpKey = `${message.guild.id}_${message.author.id}`;
    const now = Date.now();
    if (!XP_COOLDOWN.has(xpKey) || now - XP_COOLDOWN.get(xpKey) > 60000) {
      XP_COOLDOWN.set(xpKey, now);
      try {
        const { profile, leveledUp } = await addXp(message.guild.id, message.author.id, XP_PER_MESSAGE);
        if (leveledUp) {
          await sendLevelUpNotification(client, message, profile);
        }
        refreshLeaderboardMessage(client, message.guild.id).catch(() => {});
      } catch (err) {
        logger.debug(`XP error: ${err.message}`);
      }
    }
  },
};

async function sendLevelUpNotification(client, message, profile) {
  try {
    const config = await prisma.guildConfig.findUnique({ where: { guildId: message.guild.id } });
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('🎉 Passage de niveau !')
      .setDescription(`Félicitations ${message.author} ! Tu es maintenant **niveau ${profile.level}** !`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '⭐ Nouveau niveau', value: `**${profile.level}**`, inline: true },
        { name: '✨ XP total', value: `${profile.xp}`, inline: true },
      )
      .setFooter({ text: `⚔️ WestSky • ${date}` })
      .setTimestamp();

    if (config?.levelChannelId) {
      const levelChannel = await client.channels.fetch(config.levelChannelId).catch(() => null);
      if (levelChannel) {
        await levelChannel.send({ embeds: [embed] }).catch(() => {});
        return;
      }
    }

    const msg = await message.channel.send({ embeds: [embed] }).catch(() => null);
    if (msg) setTimeout(() => msg.delete().catch(() => {}), 10000);
  } catch (err) {
    logger.debug(`sendLevelUpNotification: ${err.message}`);
  }
}
