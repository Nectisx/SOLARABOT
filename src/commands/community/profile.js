// src/commands/community/profile.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getProfile, xpForLevel } = require('../../services/levelService');
const { getStats } = require('../../services/inviteService');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Voir le profil complet d\'un membre')
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre cible')),

  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const [levelProfile, inviteStats] = await Promise.all([
      getProfile(interaction.guildId, user.id),
      getStats(interaction.guildId, user.id),
    ]);
    const xpNeeded = xpForLevel(levelProfile.level);
    const score = inviteStats.invites - inviteStats.fake - inviteStats.left + inviteStats.bonus;
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const inventory = Array.isArray(levelProfile.inventory) ? levelProfile.inventory : JSON.parse(levelProfile.inventory || '[]');

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor || COLORS.PRIMARY)
      .setTitle(`⚔️ Profil de ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '⭐ Niveau', value: `${levelProfile.level}`, inline: true },
        { name: '✨ XP', value: `${levelProfile.xp} / ${Math.floor(xpNeeded)}`, inline: true },
        { name: '🪙 Pièces d\'or', value: `${levelProfile.balance}`, inline: true },
        { name: '📊 Invitations', value: `${score}`, inline: true },
        { name: '📦 Inventaire', value: `${inventory.length} objet(s)`, inline: true },
        { name: '📅 Rejoint le', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'N/A', inline: true },
      )
      .setFooter({ text: `⚔️ WESTSKY • ${date}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
