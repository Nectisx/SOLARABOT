// src/commands/admin/backup.js
const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed, permissionError } = require('../../embeds/errorEmbed');
const { COLORS } = require('../../config/constants');
const prisma = require('../../database/prisma');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Exporter les données du bot pour ce serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [permissionError('Administrator')], ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    try {
      const [config, modLogs, warnings, inviteStats, giveaways] = await Promise.all([
        prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } }),
        prisma.modLog.findMany({ where: { guildId: interaction.guildId } }),
        prisma.warning.findMany({ where: { guildId: interaction.guildId } }),
        prisma.inviteStats.findMany({ where: { guildId: interaction.guildId } }),
        prisma.giveaway.findMany({ where: { guildId: interaction.guildId } }),
      ]);
      const backup = { exportedAt: new Date().toISOString(), guildId: interaction.guildId, config, modLogs, warnings, inviteStats, giveaways };
      const buffer = Buffer.from(JSON.stringify(backup, null, 2), 'utf-8');
      const attachment = new AttachmentBuilder(buffer, { name: `backup-${interaction.guildId}-${Date.now()}.json` });
      const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const embed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle('💾 Backup exporté')
        .addFields(
          { name: '📋 Logs de mod', value: `${modLogs.length}`, inline: true },
          { name: '⚠️ Avertissements', value: `${warnings.length}`, inline: true },
          { name: '📊 Stats invitations', value: `${inviteStats.length}`, inline: true },
          { name: '🎁 Giveaways', value: `${giveaways.length}`, inline: true },
        )
        .setFooter({ text: `⚔️ WESTSKY • ${date}` });
      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (err) {
      logger.error(`backup: ${err.message}`);
      await interaction.editReply({ embeds: [errorEmbed('Erreur', err.message)] });
    }
  },
};
