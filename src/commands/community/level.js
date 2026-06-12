// src/commands/community/level.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getProfile, xpForLevel } = require('../../services/levelService');
const { COLORS } = require('../../config/constants');
const { errorEmbed } = require('../../embeds/errorEmbed');
const prisma = require('../../database/prisma');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Système de niveaux')
    .addSubcommand(sub => sub
      .setName('voir')
      .setDescription('Voir votre niveau et XP')
      .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre cible'))
    )
    .addSubcommand(sub => sub
      .setName('setup')
      .setDescription('Configurer le salon des notifications de niveau')
      .addChannelOption(opt => opt
        .setName('salon')
        .setDescription('Salon où envoyer les notifications de passage de niveau')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
      )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ embeds: [errorEmbed('Permission manquante', 'Tu dois être administrateur.')], ephemeral: true });
      }

      const channel = interaction.options.getChannel('salon');

      await prisma.guildConfig.upsert({
        where: { guildId: interaction.guildId },
        update: { levelChannelId: channel.id },
        create: { guildId: interaction.guildId, levelChannelId: channel.id },
      });

      const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const embed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle('✅ Salon de niveaux configuré')
        .setDescription(`Les notifications de passage de niveau seront envoyées dans ${channel}.`)
        .setFooter({ text: `⚔️ WestSky • ${date}` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // sous-commande "voir"
    const user = interaction.options.getUser('utilisateur') || interaction.user;
    const profile = await getProfile(interaction.guildId, user.id);
    const xpNeeded = xpForLevel(profile.level);
    const progress = Math.min(Math.floor((profile.xp / xpNeeded) * 20), 20);
    const progressBar = '█'.repeat(progress) + '░'.repeat(20 - progress);
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const embed = new EmbedBuilder()
      .setColor(COLORS.ACCENT)
      .setTitle(`📈 Niveau de ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '⭐ Niveau', value: `${profile.level}`, inline: true },
        { name: '✨ XP', value: `${profile.xp} / ${Math.floor(xpNeeded)}`, inline: true },
        { name: '🪙 Pièces d\'or', value: `${profile.balance}`, inline: true },
        { name: '📊 Progression', value: `\`[${progressBar}]\``, inline: false },
      )
      .setFooter({ text: `⚔️ WestSky • ${date}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
