// src/commands/fun/roll.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Lancer un ou plusieurs dés')
    .addStringOption(opt => opt.setName('dés').setDescription('Format: NdX (ex: 2d6, 1d20). Par défaut: 1d6')),

  async execute(interaction) {
    const diceStr = interaction.options.getString('dés') || '1d6';
    const match = diceStr.match(/^(\d+)d(\d+)$/i);
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (!match) {
      const embed = new EmbedBuilder().setColor(COLORS.DANGER).setTitle('❌ Format invalide').setDescription('Utilise le format **NdX** (ex: `2d6`, `1d20`, `3d8`)').setFooter({ text: `⚔️ WESTSKY • ${date}` });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const count = Math.min(parseInt(match[1]), 10);
    const sides = Math.min(parseInt(match[2]), 1000);
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);

    const embed = new EmbedBuilder()
      .setColor(COLORS.SECONDARY)
      .setTitle(`🎲 Lancer de dés — ${count}d${sides}`)
      .addFields(
        { name: '🎯 Résultats', value: rolls.join(', '), inline: true },
        { name: '∑ Total', value: `**${total}**`, inline: true },
      )
      .setFooter({ text: `⚔️ WESTSKY • ${date}` });

    await interaction.reply({ embeds: [embed] });
  },
};
