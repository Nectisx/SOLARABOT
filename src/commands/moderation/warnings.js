// src/commands/moderation/warnings.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { getWarnings } = require('../../services/moderationService');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Voir les avertissements d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur');
    const warns = await getWarnings(interaction.guildId, targetUser.id);
    if (warns.length === 0) {
      return interaction.reply({ embeds: [errorEmbed('Aucun avertissement', `${targetUser.tag} n'a aucun avertissement.`)], ephemeral: true });
    }
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const embed = new EmbedBuilder()
      .setColor(COLORS.SECONDARY)
      .setTitle(`⚠️ Avertissements — ${targetUser.tag}`)
      .setDescription(warns.map((w, i) => `**${i + 1}.** ${w.reason} — par <@${w.modId}> — <t:${Math.floor(new Date(w.createdAt).getTime() / 1000)}:R>`).join('\n'))
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `⚔️ WESTSKY • ${date}` });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
