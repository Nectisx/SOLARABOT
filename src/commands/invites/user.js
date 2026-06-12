// src/commands/invites/user.js
const { SlashCommandBuilder } = require('discord.js');
const { getStats } = require('../../services/inviteService');
const { buildInviteStatsEmbed } = require('../../embeds/inviteEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('Gérer les invitations')
    .addSubcommand(sub => sub
      .setName('user')
      .setDescription('Voir les stats d\'invitation d\'un membre')
      .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre cible'))
    )
    .addSubcommand(sub => sub
      .setName('leaderboard')
      .setDescription('Classement des invitations')
    )
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Ajouter des invitations bonus')
      .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true))
      .addIntegerOption(opt => opt.setName('nombre').setDescription('Nombre à ajouter').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub => sub
      .setName('remove')
      .setDescription('Retirer des invitations bonus')
      .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true))
      .addIntegerOption(opt => opt.setName('nombre').setDescription('Nombre à retirer').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub => sub
      .setName('reset')
      .setDescription('Réinitialiser les stats d\'un membre')
      .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('config')
      .setDescription('Voir la configuration des invitations')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const { PermissionFlagsBits } = require('discord.js');

    if (sub === 'user') {
      const user = interaction.options.getUser('utilisateur') || interaction.user;
      const stats = await getStats(interaction.guildId, user.id);
      const embed = buildInviteStatsEmbed(user, stats);
      await interaction.reply({ embeds: [embed] });
    }

    else if (sub === 'leaderboard') {
      const { getLeaderboard } = require('../../services/inviteService');
      const entries = await getLeaderboard(interaction.guildId, 10);
      const { buildInviteLeaderboardEmbed } = require('../../embeds/inviteEmbed');
      const embed = buildInviteLeaderboardEmbed(interaction.guild, entries);
      await interaction.reply({ embeds: [embed] });
    }

    else if (sub === 'add') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        const { errorEmbed } = require('../../embeds/errorEmbed');
        return interaction.reply({ embeds: [errorEmbed('Permission manquante', 'Manage Guild requis.')], ephemeral: true });
      }
      const user = interaction.options.getUser('utilisateur');
      const nb = interaction.options.getInteger('nombre');
      const { addBonus } = require('../../services/inviteService');
      await addBonus(interaction.guildId, user.id, nb);
      const { successEmbed } = require('../../embeds/baseEmbed');
      await interaction.reply({ embeds: [successEmbed('Invitations ajoutées', `**+${nb}** invitations bonus ajoutées à ${user.tag}.`)] });
    }

    else if (sub === 'remove') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        const { errorEmbed } = require('../../embeds/errorEmbed');
        return interaction.reply({ embeds: [errorEmbed('Permission manquante', 'Manage Guild requis.')], ephemeral: true });
      }
      const user = interaction.options.getUser('utilisateur');
      const nb = interaction.options.getInteger('nombre');
      const { removeBonus } = require('../../services/inviteService');
      await removeBonus(interaction.guildId, user.id, nb);
      const { successEmbed } = require('../../embeds/baseEmbed');
      await interaction.reply({ embeds: [successEmbed('Invitations retirées', `**-${nb}** invitations bonus retirées à ${user.tag}.`)] });
    }

    else if (sub === 'reset') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        const { errorEmbed } = require('../../embeds/errorEmbed');
        return interaction.reply({ embeds: [errorEmbed('Permission manquante', 'Manage Guild requis.')], ephemeral: true });
      }
      const user = interaction.options.getUser('utilisateur');
      const { resetStats } = require('../../services/inviteService');
      await resetStats(interaction.guildId, user.id);
      const { successEmbed } = require('../../embeds/baseEmbed');
      await interaction.reply({ embeds: [successEmbed('Stats réinitialisées', `Les invitations de ${user.tag} ont été remises à zéro.`)] });
    }

    else if (sub === 'config') {
      const prisma = require('../../database/prisma');
      const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
      const { EmbedBuilder } = require('discord.js');
      const { COLORS } = require('../../config/constants');
      const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('📊 Configuration Invitations')
        .setDescription('Système de suivi des invitations actif.')
        .setFooter({ text: `⚔️ WESTSKY • ${date}` });
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
