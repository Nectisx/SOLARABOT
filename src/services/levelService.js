// src/services/levelService.js
const { EmbedBuilder } = require('discord.js');
const prisma = require('../database/prisma');
const { COLORS } = require('../config/constants');

const LEADERBOARD_DEBOUNCE = new Map(); // guildId -> lastRefreshTimestamp (ms)

function xpForLevel(level) {
  return 100 * Math.pow(level + 1, 1.5);
}

async function addXp(guildId, userId, amount) {
  let profile = await prisma.userProfile.upsert({
    where: { guildId_userId: { guildId, userId } },
    update: { xp: { increment: amount } },
    create: { guildId, userId, xp: amount },
  });

  let leveledUp = false;
  while (profile.xp >= xpForLevel(profile.level)) {
    profile = await prisma.userProfile.update({
      where: { guildId_userId: { guildId, userId } },
      data: { level: { increment: 1 } },
    });
    leveledUp = true;
  }
  return { profile, leveledUp };
}

async function getProfile(guildId, userId) {
  return prisma.userProfile.upsert({
    where: { guildId_userId: { guildId, userId } },
    update: {},
    create: { guildId, userId },
  });
}

async function getLeaderboard(guildId, limit = 10) {
  return prisma.userProfile.findMany({
    where: { guildId },
    orderBy: [{ level: 'desc' }, { xp: 'desc' }],
    take: limit,
  });
}

function buildLeaderboardEmbed(entries, guildName, guildIcon) {
  const medals = ['🥇', '🥈', '🥉'];
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`📈 Classement XP — ${guildName}`)
    .setDescription(
      entries.length === 0
        ? 'Aucune donnée pour le moment.'
        : entries.map((e, i) =>
            `${medals[i] || `**${i + 1}.**`} <@${e.userId}> — Niveau **${e.level}** • ${e.xp} XP`
          ).join('\n')
    )
    .setThumbnail(guildIcon || null)
    .setFooter({ text: `⚔️ WESTSKY • ${date} • Mise à jour automatique` })
    .setTimestamp();
}

async function refreshLeaderboardMessage(client, guildId) {
  const now = Date.now();
  const last = LEADERBOARD_DEBOUNCE.get(guildId) || 0;
  if (now - last < 120000) return; // max une fois toutes les 2 minutes
  LEADERBOARD_DEBOUNCE.set(guildId, now);

  try {
    const config = await prisma.guildConfig.findUnique({ where: { guildId } });
    if (!config?.rankChannelId || !config?.rankMessageId) return;

    const channel = await client.channels.fetch(config.rankChannelId).catch(() => null);
    if (!channel) return;
    const msg = await channel.messages.fetch(config.rankMessageId).catch(() => null);
    if (!msg) return;

    const entries = await getLeaderboard(guildId, 10);
    const embed = buildLeaderboardEmbed(entries, channel.guild.name, channel.guild.iconURL({ dynamic: true }));
    await msg.edit({ embeds: [embed] }).catch(() => {});
  } catch {
    // non-critique, on ignore silencieusement
  }
}

module.exports = { xpForLevel, addXp, getProfile, getLeaderboard, buildLeaderboardEmbed, refreshLeaderboardMessage };
