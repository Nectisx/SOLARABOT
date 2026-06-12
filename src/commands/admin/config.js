// src/commands/admin/config.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { getConfig, updateConfig } = require('../../services/configService');
const { COLORS } = require('../../config/constants');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configurer le bot pour ce serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub.setName('view').setDescription('Voir la configuration actuelle'))
    .addSubcommand(sub => sub
      .setName('set')
      .setDescription('Modifier un paramètre')
      .addStringOption(opt => opt.setName('option').setDescription('Option à modifier').setRequired(true).addChoices(
        { name: 'Salon de logs', value: 'log_channel' },
        { name: 'Salon de bienvenue', value: 'welcome_channel' },
        { name: 'Rôle membre auto', value: 'member_role' },
        { name: 'Rôle modérateur', value: 'mod_role' },
        { name: 'Rôle mute', value: 'mute_role' },
        { name: 'Catégorie tickets', value: 'ticket_category' },
        { name: 'Salon suggestions', value: 'suggestion_channel' },
        { name: 'Salon signalements', value: 'report_channel' },
      ))
      .addChannelOption(opt => opt.setName('salon').setDescription('Salon cible'))
      .addRoleOption(opt => opt.setName('rôle').setDescription('Rôle cible'))
    )
    .addSubcommand(sub => sub.setName('reset').setDescription('Réinitialiser toute la configuration'))
    .addSubcommand(sub => sub.setName('export').setDescription('Exporter la configuration en JSON')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'view') {
      const config = await getConfig(interaction.guildId);
      const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('⚙️ Configuration du serveur')
        .addFields(
          { name: '📋 Logs', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Non configuré', inline: true },
          { name: '👋 Bienvenue', value: config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : 'Non configuré', inline: true },
          { name: '🎭 Rôle membre', value: config.memberRoleId ? `<@&${config.memberRoleId}>` : 'Non configuré', inline: true },
          { name: '🛡️ Rôle mod', value: config.modRoleId ? `<@&${config.modRoleId}>` : 'Non configuré', inline: true },
          { name: '🔇 Rôle mute', value: config.muteRoleId ? `<@&${config.muteRoleId}>` : 'Non configuré', inline: true },
          { name: '🎫 Catégorie tickets', value: config.ticketCategoryId ? `<#${config.ticketCategoryId}>` : 'Non configuré', inline: true },
          { name: '💡 Suggestions', value: config.suggestionChannelId ? `<#${config.suggestionChannelId}>` : 'Non configuré', inline: true },
          { name: '🚨 Signalements', value: config.reportChannelId ? `<#${config.reportChannelId}>` : 'Non configuré', inline: true },
        )
        .setFooter({ text: `⚔️ WESTSKY • ${date}` });
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    else if (sub === 'set') {
      const option = interaction.options.getString('option');
      const salon = interaction.options.getChannel('salon');
      const role = interaction.options.getRole('rôle');
      const value = salon?.id || role?.id;
      if (!value) return interaction.reply({ embeds: [errorEmbed('Valeur manquante', 'Fournis un salon ou un rôle.')], ephemeral: true });

      const mapping = {
        log_channel: 'logChannelId',
        welcome_channel: 'welcomeChannelId',
        member_role: 'memberRoleId',
        mod_role: 'modRoleId',
        mute_role: 'muteRoleId',
        ticket_category: 'ticketCategoryId',
        suggestion_channel: 'suggestionChannelId',
        report_channel: 'reportChannelId',
      };
      await updateConfig(interaction.guildId, { [mapping[option]]: value });
      await interaction.reply({ embeds: [successEmbed('Configuration mise à jour', `**${option}** défini sur ${salon ? `<#${salon.id}>` : `<@&${role.id}>`}`)] });
    }

    else if (sub === 'reset') {
      const { confirmRow } = require('../../components/buttons');
      const { warningEmbed } = require('../../embeds/baseEmbed');
      const row = confirmRow('confirm_config_reset', 'cancel_config_reset', '⚠️ Réinitialiser', '↩️ Annuler');
      const reply = await interaction.reply({
        embeds: [warningEmbed('Confirmation', 'Tu vas réinitialiser **toute** la configuration du bot pour ce serveur.')],
        components: [row],
        ephemeral: true,
        fetchReply: true,
      });
      const filter = i => i.user.id === interaction.user.id;
      try {
        const btn = await reply.awaitMessageComponent({ filter, time: 15000 });
        if (btn.customId === 'confirm_config_reset') {
          const prisma = require('../../database/prisma');
          await prisma.guildConfig.update({
            where: { guildId: interaction.guildId },
            data: {
              logChannelId: null, welcomeChannelId: null, welcomeMessage: null,
              memberRoleId: null, modRoleId: null, adminRoleId: null, muteRoleId: null,
              ticketCategoryId: null, suggestionChannelId: null, reportChannelId: null,
              musicChannelId: null, rglChannelId: null, rglMessageId: null, rglRoleId: null,
            },
          });
          await btn.update({ embeds: [successEmbed('Réinitialisé', 'Configuration réinitialisée.')], components: [] });
        } else {
          await btn.update({ embeds: [successEmbed('Annulé', 'Réinitialisation annulée.')], components: [] });
        }
      } catch {
        await interaction.editReply({ embeds: [errorEmbed('Timeout', 'Délai dépassé.')], components: [] });
      }
    }

    else if (sub === 'export') {
      const config = await getConfig(interaction.guildId);
      const { AttachmentBuilder } = require('discord.js');
      const json = JSON.stringify(config, null, 2);
      const buffer = Buffer.from(json, 'utf-8');
      const attachment = new AttachmentBuilder(buffer, { name: `config-${interaction.guildId}.json` });
      await interaction.reply({ content: '📦 Voici ta configuration exportée :', files: [attachment], ephemeral: true });
    }
  },
};
