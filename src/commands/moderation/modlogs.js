// src/commands/moderation/modlogs.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getModLogs } = require('../../services/moderationService');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modlogs')
    .setDescription('Voir les logs de modération d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true))
    .addIntegerOption(opt => opt.setName('nombre').setDescription('Nombre de logs (max 25)').setMinValue(1).setMaxValue(25)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur');
    const nb = interaction.options.getInteger('nombre') || 10;
    const logs = await getModLogs(interaction.guildId, targetUser.id, nb);
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const actionEmojis = { ban: '🔨', kick: '👢', mute: '🔇', warn: '⚠️', timeout: '⏰', unban: '🔓', unmute: '🔊', softban: '🔨' };

    const embed = new EmbedBuilder()
      .setColor(COLORS.SECONDARY)
      .setTitle(`🛡️ Logs de modération — ${targetUser.tag}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setDescription(
        logs.length === 0
          ? 'Aucun log de modération.'
          : logs.map((l, i) =>
            `**${i + 1}.** ${actionEmojis[l.action] || '📋'} **${l.action.toUpperCase()}** — par <@${l.modId}>\n` +
            `　📝 ${l.reason || 'Aucune raison'} — <t:${Math.floor(new Date(l.createdAt).getTime() / 1000)}:R>`
          ).join('\n\n')
      )
      .setFooter({ text: `⚔️ WESTSKY • ${date}` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
