// src/commands/info/userinfo.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Afficher les informations d\'un membre')
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre cible')),

  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const roles = member
      ? member.roles.cache.filter(r => r.id !== interaction.guildId).sort((a, b) => b.position - a.position).map(r => `<@&${r.id}>`).slice(0, 10).join(' ')
      : 'N/A';

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor || COLORS.PRIMARY)
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '🤖 Bot ?', value: user.bot ? 'Oui' : 'Non', inline: true },
        { name: '📅 Créé le', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '📥 Rejoint le', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'N/A', inline: true },
        { name: `🎭 Rôles (${member?.roles.cache.size - 1 || 0})`, value: roles || 'Aucun', inline: false },
      )
      .setFooter({ text: `⚔️ WESTSKY • ${date}` })
      .setTimestamp();

    if (member?.nickname) embed.addFields({ name: '📝 Surnom', value: member.nickname, inline: true });

    await interaction.reply({ embeds: [embed] });
  },
};
