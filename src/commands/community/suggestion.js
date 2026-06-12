// src/commands/community/suggestion.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { COLORS } = require('../../config/constants');
const prisma = require('../../database/prisma');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('Soumettre une suggestion')
    .addStringOption(opt => opt.setName('contenu').setDescription('Ta suggestion').setRequired(true).setMaxLength(1000)),

  async execute(interaction) {
    const content = interaction.options.getString('contenu');
    const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
    if (!config?.suggestionChannelId) {
      return interaction.reply({ embeds: [errorEmbed('Non configuré', 'Le salon de suggestions n\'est pas configuré.')], ephemeral: true });
    }
    const channel = await interaction.guild.channels.fetch(config.suggestionChannelId).catch(() => null);
    if (!channel) return interaction.reply({ embeds: [errorEmbed('Salon introuvable', 'Le salon de suggestions est introuvable.')], ephemeral: true });

    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const embed = new EmbedBuilder()
      .setColor(COLORS.SECONDARY)
      .setTitle('💡 Nouvelle suggestion')
      .setDescription(content)
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .addFields({ name: '📊 Statut', value: '⏳ En attente' })
      .setFooter({ text: `⚔️ WESTSKY • ${date}` })
      .setTimestamp();

    const msg = await channel.send({ embeds: [embed] });
    await msg.react('✅').catch(() => {});
    await msg.react('❌').catch(() => {});

    try {
      await prisma.suggestion.create({
        data: { guildId: interaction.guildId, messageId: msg.id, userId: interaction.user.id, content },
      });
    } catch (err) {
      logger.debug(`suggestion db: ${err.message}`);
    }

    await interaction.reply({ embeds: [successEmbed('Suggestion envoyée', `Ta suggestion a été soumise dans <#${channel.id}>.`)], ephemeral: true });
  },
};
