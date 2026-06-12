// src/commands/community/ticket.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { ticketCloseRow, ticketPanelSelectRow } = require('../../components/buttons');
const prisma = require('../../database/prisma');
const { COLORS } = require('../../config/constants');
const TICKET_CATEGORIES = require('../../config/ticketCategories');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Système de tickets')
    .addSubcommand(sub => sub
      .setName('setup')
      .setDescription('Créer le panneau de tickets dans un salon')
      .addChannelOption(opt => opt
        .setName('salon')
        .setDescription('Salon où afficher le panneau de tickets')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
      )
      .addStringOption(opt => opt
        .setName('titre')
        .setDescription('Titre de l\'embed du panneau')
        .setRequired(false)
      )
    )
    .addSubcommand(sub => sub.setName('close').setDescription('Fermer le ticket actuel')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ embeds: [errorEmbed('Permission manquante', 'Tu dois être administrateur pour utiliser cette commande.')], ephemeral: true });
      }

      const channel = interaction.options.getChannel('salon');
      const title = interaction.options.getString('titre') || '🎫 Ouvrir un ticket';
      const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      const categoryList = TICKET_CATEGORIES.map(c => `${c.emoji} **${c.label.replace(/[^ -~À-ɏ\u{1F000}-\u{1FFFF}]/gu, '')}**`).join('\n');

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(title)
        .setDescription(
          'Sélectionne une catégorie dans le menu ci-dessous pour ouvrir un ticket.\n' +
          'Notre équipe de support te répondra dans les plus brefs délais.\n\n' +
          '**Catégories disponibles :**\n' +
          TICKET_CATEGORIES.map(c => `${c.emoji} **${c.label.split(' ').slice(1).join(' ')}** — ${c.description}`).join('\n')
        )
        .setFooter({ text: `⚔️ WESTSKY • ${date}` })
        .setTimestamp();

      const row = ticketPanelSelectRow();

      await interaction.deferReply({ ephemeral: true });

      try {
        const msg = await channel.send({ embeds: [embed], components: [row] });

        await prisma.ticketPanel.upsert({
          where: { guildId: interaction.guildId },
          update: { channelId: channel.id, messageId: msg.id, title },
          create: { guildId: interaction.guildId, channelId: channel.id, messageId: msg.id, title },
        });

        await interaction.editReply({ content: `✅ Panneau de tickets créé dans ${channel} !` });
        logger.info(`[Ticket] Panneau créé dans #${channel.name} par ${interaction.user.tag}`);
      } catch (err) {
        logger.error(`[Ticket setup] ${err.message}`);
        await interaction.editReply({ content: `❌ Erreur lors de la création du panneau : ${err.message}` });
      }
      return;
    }

    if (sub === 'close') {
      const ticket = await prisma.ticket.findUnique({ where: { channelId: interaction.channelId } });
      if (!ticket) return interaction.reply({ embeds: [errorEmbed('Pas un ticket', 'Ce salon n\'est pas un ticket.')], ephemeral: true });
      const canClose = ticket.userId === interaction.user.id || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);
      if (!canClose) return interaction.reply({ embeds: [errorEmbed('Permission manquante', 'Tu ne peux pas fermer ce ticket.')], ephemeral: true });
      await prisma.ticket.update({ where: { channelId: interaction.channelId }, data: { status: 'closed', closedAt: new Date() } });
      await interaction.reply({ content: '🔒 Ticket fermé. Suppression dans 5 secondes.' });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  },
};
