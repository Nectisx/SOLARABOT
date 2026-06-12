// src/services/tempBanService.js
const { EmbedBuilder } = require('discord.js');
const prisma = require('../database/prisma');
const { addModLog } = require('./moderationService');
const { buildModEmbed } = require('../embeds/moderationEmbed');
const { formatDuration } = require('../utils/timeParser');
const { COLORS } = require('../config/constants');
const logger = require('../utils/logger');

const pendingTimers = new Map(); // `${guildId}_${userId}` → Timer

async function createTempBan(client, guild, targetUser, moderator, reason, durationSeconds) {
  const expiresAt = new Date(Date.now() + durationSeconds * 1000);

  await guild.members.ban(targetUser.id, { reason: `[Expulsion temp] ${reason}` });

  const tempBan = await prisma.tempBan.create({
    data: { guildId: guild.id, userId: targetUser.id, modId: moderator.id, reason, expiresAt },
  });

  await addModLog(guild.id, targetUser.id, moderator.id, 'tempkick', reason, durationSeconds);
  await _sendActionLog(client, guild.id, moderator, targetUser, reason, durationSeconds, expiresAt);

  _scheduleUnban(client, tempBan.id, guild.id, targetUser.id, durationSeconds);
  return tempBan;
}

function _scheduleUnban(client, tempBanId, guildId, userId, delaySeconds) {
  const key = `${guildId}_${userId}`;
  if (pendingTimers.has(key)) clearTimeout(pendingTimers.get(key));

  // setTimeout max ~24.8 jours — acceptable pour une expulsion temporaire
  const delayMs = Math.min(delaySeconds * 1000, 2147483647);
  const timer = setTimeout(async () => {
    pendingTimers.delete(key);
    await _executeUnban(client, tempBanId, guildId, userId);
  }, delayMs);

  pendingTimers.set(key, timer);
}

async function _executeUnban(client, tempBanId, guildId, userId) {
  try {
    const tempBan = await prisma.tempBan.findUnique({ where: { id: tempBanId } });
    if (!tempBan || tempBan.unbanned) return;

    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (guild) {
      await guild.members.unban(userId, 'Expulsion temporaire expirée').catch(() => {});
    }

    await prisma.tempBan.update({ where: { id: tempBanId }, data: { unbanned: true } });
    await _sendExpireLog(client, guildId, userId, tempBan.reason);

    logger.info(`[TempBan] Expiration → userId ${userId} débanni (guild ${guildId})`);
  } catch (err) {
    logger.error(`_executeUnban: ${err.message}`);
  }
}

async function restoreActiveTempBans(client) {
  try {
    const now = new Date();

    // Expirées pendant que le bot était hors ligne → débannir immédiatement
    const expired = await prisma.tempBan.findMany({
      where: { unbanned: false, expiresAt: { lte: now } },
    });
    for (const tb of expired) {
      await _executeUnban(client, tb.id, tb.guildId, tb.userId);
    }

    // Encore actives → replanifier
    const active = await prisma.tempBan.findMany({
      where: { unbanned: false, expiresAt: { gt: now } },
    });
    for (const tb of active) {
      const remainingSeconds = Math.ceil((tb.expiresAt.getTime() - Date.now()) / 1000);
      _scheduleUnban(client, tb.id, tb.guildId, tb.userId, remainingSeconds);
    }

    if (expired.length + active.length > 0) {
      logger.info(`[TempBan] Restauré : ${active.length} actif(s), ${expired.length} expiré(s) traité(s)`);
    }
  } catch (err) {
    logger.error(`restoreActiveTempBans: ${err.message}`);
  }
}

async function _sendActionLog(client, guildId, moderator, target, reason, durationSeconds, expiresAt) {
  try {
    const config = await prisma.guildConfig.findUnique({ where: { guildId } });
    if (!config?.logChannelId) return;
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return;
    const logCh = await guild.channels.fetch(config.logChannelId).catch(() => null);
    if (!logCh) return;

    const embed = buildModEmbed('tempkick', moderator, target, reason, {
      duration: formatDuration(durationSeconds),
      expiresAt: `<t:${Math.floor(expiresAt.getTime() / 1000)}:F>`,
    });
    await logCh.send({ embeds: [embed] }).catch(() => {});
  } catch (err) {
    logger.error(`_sendActionLog tempkick: ${err.message}`);
  }
}

async function _sendExpireLog(client, guildId, userId, originalReason) {
  try {
    const config = await prisma.guildConfig.findUnique({ where: { guildId } });
    if (!config?.logChannelId) return;
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return;
    const logCh = await guild.channels.fetch(config.logChannelId).catch(() => null);
    if (!logCh) return;

    const date = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('✅ Expulsion temporaire expirée')
      .addFields(
        { name: '👤 Membre', value: `<@${userId}> (${userId})`, inline: true },
        { name: '🤖 Action', value: 'Débannissement automatique', inline: true },
        { name: '📝 Raison originale', value: originalReason || 'Aucune', inline: false },
      )
      .setFooter({ text: `⚔️ WESTSKY • ${date}` })
      .setTimestamp();

    await logCh.send({ embeds: [embed] }).catch(() => {});
  } catch (err) {
    logger.error(`_sendExpireLog: ${err.message}`);
  }
}

module.exports = { createTempBan, restoreActiveTempBans };
