// src/commands/info/avatar.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Afficher l\'avatar d\'un membre')
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre cible')),

  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const globalAvatar = user.displayAvatarURL({ dynamic: true, size: 512 });
    const serverAvatar = member?.displayAvatarURL({ dynamic: true, size: 512 });

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`🖼️ Avatar de ${user.tag}`)
      .setImage(serverAvatar || globalAvatar)
      .setFooter({ text: `⚔️ WESTSKY • ${date}` })
      .setTimestamp();

    if (serverAvatar && serverAvatar !== globalAvatar) {
      embed.setDescription(`[Avatar global](${globalAvatar}) • [Avatar du serveur](${serverAvatar})`);
    } else {
      embed.setDescription(`[Lien direct](${globalAvatar})`);
    }

    await interaction.reply({ embeds: [embed] });
  },
};
