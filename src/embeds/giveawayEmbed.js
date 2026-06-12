// src/embeds/giveawayEmbed.js
const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../config/constants');
const { formatTimeRemaining } = require('../utils/timeParser');

function buildGiveawayEmbed(giveaway, entriesCount = 0, userTickets = null) {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const timeLeft = formatTimeRemaining(new Date(giveaway.endsAt));
  const chancePercent = entriesCount > 0
    ? ((1 / entriesCount) * 100 * giveaway.winnersCount).toFixed(1)
    : '100.0';

  const bonusRoles = Array.isArray(giveaway.bonusRoles) ? giveaway.bonusRoles : JSON.parse(giveaway.bonusRoles || '[]');

  const embed = new EmbedBuilder()
    .setColor(giveaway.status === 'paused' ? COLORS.DEEP : COLORS.PRIMARY)
    .setTitle(`${EMOJIS.GIVEAWAY} GIVEAWAY LÉGENDAIRE`)
    .setDescription(
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏆 **Lot :** ${giveaway.prize}\n` +
      `⏰ **${giveaway.status === 'paused' ? 'EN PAUSE' : 'Fin dans'} :** ${giveaway.status === 'paused' ? '⏸️ Mis en pause' : timeLeft}\n` +
      `👥 **Participants :** ${entriesCount}\n` +
      `🎯 **Gagnants :** ${giveaway.winnersCount}\n` +
      `📊 **Ta chance :** ~${chancePercent}%\n` +
      (userTickets ? `🎫 **Tes tickets :** ${userTickets}\n` : '') +
      (bonusRoles.length > 0
        ? `\n✨ **Bonus de chance :**\n${bonusRoles.map(b => `• <@&${b.roleId}> : ×${b.multiplier} tickets`).join('\n')}\n`
        : '') +
      (giveaway.requiredRoleId ? `\n🔒 **Rôle requis :** <@&${giveaway.requiredRoleId}>\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━━`
    )
    .setFooter({ text: `⚔️ WESTSKY • ${date} • ID: ${giveaway.id}` })
    .setTimestamp(new Date(giveaway.endsAt));

  return embed;
}

function buildGiveawayEndedEmbed(giveaway, winners) {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return new EmbedBuilder()
    .setColor(COLORS.ACCENT)
    .setTitle(`${EMOJIS.GIVEAWAY} GIVEAWAY TERMINÉ`)
    .setDescription(
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏆 **Lot :** ${giveaway.prize}\n` +
      `👑 **${winners.length > 1 ? 'Gagnants' : 'Gagnant'} :** ${winners.length > 0 ? winners.map(w => `<@${w}>`).join(', ') : 'Aucun gagnant (pas assez de participants)'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━`
    )
    .setFooter({ text: `⚔️ WESTSKY • ${date}` })
    .setTimestamp();
}

module.exports = { buildGiveawayEmbed, buildGiveawayEndedEmbed };
