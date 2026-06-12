// src/embeds/inviteEmbed.js
const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../config/constants');

function buildInviteStatsEmbed(user, stats) {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const score = stats.invites - stats.fake - stats.left + stats.bonus;
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.INVITES} Statistiques d'invitations`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setDescription(`Invitations de **${user.tag}**`)
    .addFields(
      { name: '📊 Score total', value: `**${score}** invitations nettes`, inline: false },
      { name: '✅ Réelles', value: `${stats.invites}`, inline: true },
      { name: '❌ Fausses', value: `${stats.fake}`, inline: true },
      { name: '🚪 Parties', value: `${stats.left}`, inline: true },
      { name: '🎁 Bonus', value: `${stats.bonus}`, inline: true },
    )
    .setFooter({ text: `⚔️ WESTSKY • ${date}` })
    .setTimestamp();
}

function buildInviteLeaderboardEmbed(guild, entries) {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const medals = ['🥇', '🥈', '🥉'];
  const description = entries.length === 0
    ? 'Aucune donnée d\'invitation disponible.'
    : entries.map((e, i) => {
      const medal = medals[i] || `**${i + 1}.**`;
      const score = e.invites - e.fake - e.left + e.bonus;
      return `${medal} <@${e.userId}> — **${score}** invitations`;
    }).join('\n');

  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.INVITES} Classement des Invitations — ${guild.name}`)
    .setDescription(description)
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setFooter({ text: `⚔️ WESTSKY • ${date}` })
    .setTimestamp();
}

module.exports = { buildInviteStatsEmbed, buildInviteLeaderboardEmbed };
