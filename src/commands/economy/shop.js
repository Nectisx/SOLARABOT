// src/commands/economy/shop.js
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

const SHOP_URL = 'https://solvara.fr/';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Accéder au shop du serveur'),

  async execute(interaction) {
    const date = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('🛒 Shop SOLARA')
      .setDescription(
        '**Retrouve tous nos articles, grades et avantages exclusifs sur notre boutique en ligne !**\n\n' +
        '> 🎖️ Grades & Rangs\n' +
        '> 💎 Avantages & Cosmétiques\n' +
        '> 🎁 Packs spéciaux\n\n' +
        `**🔗 [Accéder au shop](${SHOP_URL})**`
      )
      .setFooter({ text: `⚔️ SOLARA • ${date}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🛒 Ouvrir le Shop')
        .setURL(SHOP_URL)
        .setStyle(ButtonStyle.Link),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
