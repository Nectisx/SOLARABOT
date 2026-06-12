// src/embeds/welcomeEmbed.js
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../config/constants');

function buildWelcomeEmbed(member, inviter, inviterStats, memberCount) {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('👋 NOUVEAU MEMBRE')
    .setDescription(
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🗡️ **${member.user.tag}** vient de rejoindre le royaume !\n\n` +
      (inviter ? `👥 **Invité par :** ${inviter.tag} (${inviterStats ? inviterStats.invites - inviterStats.fake - inviterStats.left + inviterStats.bonus : 0} invitations)\n` : '') +
      `🏰 **Membres du serveur :** ${memberCount}\n\n` +
      `Bienvenue parmi nous, aventurier ! Lis le 📜 règlement pour commencer ton aventure.\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `⚔️ WESTSKY • ${date}` })
    .setTimestamp();
}

function buildLeaveEmbed(member, memberCount) {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return new EmbedBuilder()
    .setColor(COLORS.DEEP)
    .setTitle('🚪 DÉPART D\'UN MEMBRE')
    .setDescription(
      `**${member.user.tag}** a quitté le royaume.\n` +
      `🏰 **Membres restants :** ${memberCount}`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `⚔️ WESTSKY • ${date}` })
    .setTimestamp();
}

module.exports = { buildWelcomeEmbed, buildLeaveEmbed };
