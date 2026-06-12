// src/commands/fun/meme.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { COLORS } = require('../../config/constants');
const axios = require('axios');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Générer un mème aléatoire'),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const res = await axios.get('https://meme-api.com/gimme/ProgrammerHumor', { timeout: 5000 });
      const meme = res.data;
      const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      if (meme.nsfw) {
        return interaction.editReply({ embeds: [errorEmbed('Contenu NSFW', 'Ce mème n\'est pas approprié pour ce serveur. Réessaie.')] });
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.ACCENT)
        .setTitle(meme.title)
        .setImage(meme.url)
        .setURL(meme.postLink)
        .addFields({ name: '⬆️ Upvotes', value: `${meme.ups}`, inline: true })
        .setFooter({ text: `⚔️ WESTSKY • ${date} • r/${meme.subreddit}` });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.warn(`meme: ${err.message}`);
      await interaction.editReply({ embeds: [errorEmbed('Erreur', 'Impossible de récupérer un mème. L\'API est peut-être indisponible.')] });
    }
  },
};
