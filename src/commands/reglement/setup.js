// src/commands/reglement/setup.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { acceptRulesRow } = require('../../components/buttons');
const { updateConfig } = require('../../services/configService');
const { COLORS } = require('../../config/constants');
const prisma = require('../../database/prisma');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reglement')
    .setDescription('Gérer le système de règlement')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub
      .setName('setup')
      .setDescription('Créer ou recréer le message de règlement')
      .addChannelOption(opt => opt.setName('salon').setDescription('Salon pour le règlement').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addRoleOption(opt => opt.setName('rôle').setDescription('Rôle à donner après acceptation').setRequired(true))
      .addStringOption(opt => opt.setName('titre').setDescription('Titre du règlement').setRequired(true))
      .addStringOption(opt => opt.setName('texte').setDescription('Texte du règlement').setRequired(true))
      .addStringOption(opt => opt.setName('mode').setDescription('Mode d\'acceptation').addChoices(
        { name: '🔘 Bouton', value: 'button' },
        { name: '✅ Réaction', value: 'reaction' }
      ))
    )
    .addSubcommand(sub => sub
      .setName('edit')
      .setDescription('Modifier le texte du règlement existant')
      .addStringOption(opt => opt.setName('texte').setDescription('Nouveau texte').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('disable')
      .setDescription('Désactiver le système de règlement')
    )
    .addSubcommand(sub => sub
      .setName('status')
      .setDescription('Voir la configuration du règlement')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      await interaction.deferReply({ ephemeral: true });
      const salon = interaction.options.getChannel('salon');
      const role = interaction.options.getRole('rôle');
      const titre = interaction.options.getString('titre');
      const texte = interaction.options.getString('texte');
      const mode = interaction.options.getString('mode') || 'button';

      const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`📜 ${titre}`)
        .setDescription(texte)
        .setFooter({ text: `⚔️ WESTSKY • ${date}` })
        .setTimestamp();

      let msg;
      if (mode === 'button') {
        const row = acceptRulesRow();
        msg = await salon.send({ embeds: [embed], components: [row] });
      } else {
        msg = await salon.send({ embeds: [embed] });
        await msg.react('✅').catch(() => {});
      }

      await updateConfig(interaction.guildId, {
        rglChannelId: salon.id,
        rglMessageId: msg.id,
        rglRoleId: role.id,
        rglMode: mode,
      });

      await interaction.editReply({ embeds: [successEmbed('Règlement configuré', `Message envoyé dans <#${salon.id}>\nRôle: <@&${role.id}>\nMode: ${mode}`)] });
    }

    else if (sub === 'edit') {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
      if (!config?.rglChannelId || !config?.rglMessageId) {
        return interaction.reply({ embeds: [errorEmbed('Non configuré', 'Aucun règlement configuré. Utilise `/reglement setup`.')], ephemeral: true });
      }
      const newTexte = interaction.options.getString('texte');
      try {
        const channel = await interaction.guild.channels.fetch(config.rglChannelId).catch(() => null);
        if (!channel) return interaction.reply({ embeds: [errorEmbed('Salon introuvable', 'Le salon du règlement est introuvable.')], ephemeral: true });
        const msg = await channel.messages.fetch(config.rglMessageId).catch(() => null);
        if (!msg) return interaction.reply({ embeds: [errorEmbed('Message introuvable', 'Le message du règlement est introuvable.')], ephemeral: true });
        const oldEmbed = msg.embeds[0];
        const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const newEmbed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle(oldEmbed?.title || '📜 Règlement')
          .setDescription(newTexte)
          .setFooter({ text: `⚔️ WESTSKY • ${date}` })
          .setTimestamp();
        await msg.edit({ embeds: [newEmbed] });
        await interaction.reply({ embeds: [successEmbed('Règlement modifié', 'Le texte du règlement a été mis à jour.')], ephemeral: true });
      } catch (err) {
        logger.error(`reglement edit: ${err.message}`);
        await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
      }
    }

    else if (sub === 'disable') {
      await updateConfig(interaction.guildId, { rglChannelId: null, rglMessageId: null, rglRoleId: null });
      await interaction.reply({ embeds: [successEmbed('Règlement désactivé', 'Le système de règlement a été désactivé.')] });
    }

    else if (sub === 'status') {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
      const { EmbedBuilder } = require('discord.js');
      const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const embed = new EmbedBuilder()
        .setColor(COLORS.LIGHT)
        .setTitle('📜 Statut du Règlement')
        .addFields(
          { name: '📢 Salon', value: config?.rglChannelId ? `<#${config.rglChannelId}>` : 'Non configuré', inline: true },
          { name: '🎭 Rôle', value: config?.rglRoleId ? `<@&${config.rglRoleId}>` : 'Non configuré', inline: true },
          { name: '🔘 Mode', value: config?.rglMode || 'button', inline: true },
        )
        .setFooter({ text: `⚔️ WESTSKY • ${date}` });
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
