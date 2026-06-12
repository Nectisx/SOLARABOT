// src/embeds/moderationEmbed.js
const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../config/constants');

function buildModEmbed(action, moderator, target, reason, extra = {}) {
  const actionColors = {
    ban: COLORS.DANGER,
    softban: COLORS.DANGER,
    kick: COLORS.DEEP,
    tempkick: COLORS.DEEP,
    tempkick_expire: COLORS.SUCCESS,
    mute: COLORS.DEEP,
    timeout: COLORS.DEEP,
    warn: COLORS.SECONDARY,
    unmute: COLORS.SUCCESS,
    unban: COLORS.SUCCESS,
    lock: COLORS.DEEP,
    unlock: COLORS.SUCCESS,
    purge: COLORS.SECONDARY,
    nick: COLORS.LIGHT,
    slowmode: COLORS.LIGHT,
  };
  const actionEmojis = {
    ban: '🔨',
    softban: '🔨',
    kick: '👢',
    tempkick: '⏰👢',
    tempkick_expire: '✅',
    mute: '🔇',
    timeout: '⏰',
    warn: '⚠️',
    unmute: '🔊',
    unban: '🔓',
    lock: '🔒',
    unlock: '🔓',
    purge: '🗑️',
    nick: '📝',
    slowmode: '🐌',
  };
  const actionLabels = {
    ban: 'Bannissement',
    softban: 'Soft-ban',
    kick: 'Expulsion',
    tempkick: 'Expulsion Temporaire',
    tempkick_expire: 'Expulsion Temporaire Expirée',
    mute: 'Muet',
    timeout: 'Timeout',
    warn: 'Avertissement',
    unmute: 'Démutage',
    unban: 'Dé-bannissement',
    lock: 'Verrouillage',
    unlock: 'Déverrouillage',
    purge: 'Purge',
    nick: 'Surnom modifié',
    slowmode: 'Slowmode',
  };

  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const embed = new EmbedBuilder()
    .setColor(actionColors[action] || COLORS.PRIMARY)
    .setTitle(`${actionEmojis[action] || EMOJIS.MODERATION} ${actionLabels[action] || action}`)
    .setThumbnail(target?.displayAvatarURL?.({ dynamic: true }) ?? null)
    .addFields(
      { name: '👤 Membre', value: target ? `${target.tag || target.user?.tag || 'Inconnu'} (${target.id})` : 'Inconnu', inline: true },
      { name: '🛡️ Modérateur', value: `${moderator.tag || moderator.user?.tag || 'Système'} (${moderator.id})`, inline: true },
      { name: '📝 Raison', value: reason || 'Aucune raison fournie', inline: false },
    )
    .setFooter({ text: `⚔️ WESTSKY • ${date}` })
    .setTimestamp();

  if (extra.duration) embed.addFields({ name: '⏱️ Durée', value: extra.duration, inline: true });
  if (extra.expiresAt) embed.addFields({ name: '📅 Expiration', value: extra.expiresAt, inline: true });
  if (extra.count) embed.addFields({ name: '🗑️ Messages supprimés', value: `${extra.count}`, inline: true });

  return embed;
}

module.exports = { buildModEmbed };
