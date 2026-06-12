// src/commands/info/serverinfo.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Afficher les informations du serveur'),

  async execute(interaction) {
    const guild = interaction.guild;
    await guild.fetch();
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const owner = await guild.fetchOwner().catch(() => null);
    const channels = guild.channels.cache;
    const textChannels = channels.filter(c => c.type === 0).size;
    const voiceChannels = channels.filter(c => c.type === 2).size;
    const categoryChannels = channels.filter(c => c.type === 4).size;

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`🏰 ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: '🆔 ID', value: guild.id, inline: true },
        { name: '👑 Propriétaire', value: owner ? `${owner.user.tag}` : 'Inconnu', inline: true },
        { name: '📅 Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '👥 Membres', value: `${guild.memberCount}`, inline: true },
        { name: '🎭 Rôles', value: `${guild.roles.cache.size}`, inline: true },
        { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
        { name: '📢 Salons texte', value: `${textChannels}`, inline: true },
        { name: '🔊 Salons vocaux', value: `${voiceChannels}`, inline: true },
        { name: '📁 Catégories', value: `${categoryChannels}`, inline: true },
        { name: '🚀 Boosts', value: `${guild.premiumSubscriptionCount} (Niveau ${guild.premiumTier})`, inline: true },
        { name: '🔒 Vérification', value: `Niveau ${guild.verificationLevel}`, inline: true },
      )
      .setFooter({ text: `⚔️ WESTSKY • ${date}` })
      .setTimestamp();

    if (guild.bannerURL()) embed.setImage(guild.bannerURL({ dynamic: true }));

    await interaction.reply({ embeds: [embed] });
  },
};
