// src/commands/admin/announce.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { errorEmbed, permissionError } = require('../../embeds/errorEmbed');
const { COLORS } = require('../../config/constants');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Faire une annonce avec ou sans mention')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt => opt.setName('message').setDescription('Contenu de l\'annonce').setRequired(true))
    .addChannelOption(opt => opt.setName('salon').setDescription('Salon cible').addChannelTypes(ChannelType.GuildText))
    .addRoleOption(opt => opt.setName('mention').setDescription('Rôle à mentionner'))
    .addBooleanOption(opt => opt.setName('embed').setDescription('Envoyer en embed')),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ embeds: [permissionError('Manage Guild')], ephemeral: true });
    }
    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('salon') || interaction.channel;
    const mention = interaction.options.getRole('mention');
    const useEmbed = interaction.options.getBoolean('embed') ?? false;
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    try {
      if (useEmbed) {
        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle('📢 Annonce')
          .setDescription(message)
          .setFooter({ text: `⚔️ WESTSKY • ${date} • Par ${interaction.user.tag}` })
          .setTimestamp();
        await channel.send({ content: mention ? mention.toString() : undefined, embeds: [embed] });
      } else {
        await channel.send({ content: `${mention ? mention.toString() + '\n' : ''}${message}` });
      }
      await interaction.reply({ content: `✅ Annonce envoyée dans <#${channel.id}>`, ephemeral: true });
    } catch (err) {
      logger.error(`announce: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
    }
  },
};
