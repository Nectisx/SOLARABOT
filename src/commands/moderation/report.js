// src/commands/moderation/report.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const prisma = require('../../database/prisma');
const { COLORS } = require('../../config/constants');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Signaler un membre')
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à signaler').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison du signalement').setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur');
    const raison = interaction.options.getString('raison');
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed('Action impossible', 'Tu ne peux pas te signaler toi-même.')], ephemeral: true });
    }
    const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
    if (!config?.reportChannelId) {
      return interaction.reply({ embeds: [errorEmbed('Salon non configuré', 'Le salon de signalements n\'est pas configuré.')], ephemeral: true });
    }
    const channel = await interaction.guild.channels.fetch(config.reportChannelId).catch(() => null);
    if (!channel) return interaction.reply({ embeds: [errorEmbed('Erreur', 'Salon de signalement introuvable.')], ephemeral: true });

    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const embed = new EmbedBuilder()
      .setColor(COLORS.DANGER)
      .setTitle('🚨 Nouveau signalement')
      .addFields(
        { name: '👤 Membre signalé', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
        { name: '📣 Signalé par', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
        { name: '📝 Raison', value: raison },
        { name: '📍 Salon', value: `<#${interaction.channelId}>` },
      )
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `⚔️ WESTSKY • ${date}` });

    await channel.send({ embeds: [embed] });
    await interaction.reply({ embeds: [successEmbed('Signalement envoyé', 'Ton signalement a été transmis à l\'équipe de modération.')], ephemeral: true });
  },
};
