// src/commands/info/roleinfo.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Afficher les informations d\'un rôle')
    .addRoleOption(opt => opt.setName('rôle').setDescription('Rôle cible').setRequired(true)),

  async execute(interaction) {
    const role = interaction.options.getRole('rôle');
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const membersWithRole = interaction.guild.members.cache.filter(m => m.roles.cache.has(role.id)).size;

    const embed = new EmbedBuilder()
      .setColor(role.color || COLORS.PRIMARY)
      .setTitle(`🎭 ${role.name}`)
      .addFields(
        { name: '🆔 ID', value: role.id, inline: true },
        { name: '🎨 Couleur', value: role.hexColor, inline: true },
        { name: '📍 Position', value: `${role.position}`, inline: true },
        { name: '👥 Membres', value: `${membersWithRole}`, inline: true },
        { name: '🗂️ Hissé séparément', value: role.hoist ? 'Oui' : 'Non', inline: true },
        { name: '🔖 Mentionnable', value: role.mentionable ? 'Oui' : 'Non', inline: true },
        { name: '📅 Créé le', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '🤖 Géré', value: role.managed ? 'Oui (intégration)' : 'Non', inline: true },
      )
      .setFooter({ text: `⚔️ WESTSKY • ${date}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
