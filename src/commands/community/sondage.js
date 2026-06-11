// src/commands/community/sondage.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { COLORS } = require('../../config/constants');
const prisma = require('../../database/prisma');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sondage')
    .setDescription('Créer un sondage')
    .addStringOption(opt => opt.setName('question').setDescription('Question du sondage').setRequired(true))
    .addStringOption(opt => opt.setName('option1').setDescription('Option 1').setRequired(true))
    .addStringOption(opt => opt.setName('option2').setDescription('Option 2').setRequired(true))
    .addStringOption(opt => opt.setName('option3').setDescription('Option 3'))
    .addStringOption(opt => opt.setName('option4').setDescription('Option 4')),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const options = [
      interaction.options.getString('option1'),
      interaction.options.getString('option2'),
      interaction.options.getString('option3'),
      interaction.options.getString('option4'),
    ].filter(Boolean);

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`📊 ${question}`)
      .setDescription(options.map((opt, i) => `${emojis[i]} **${opt}**`).join('\n\n'))
      .setFooter({ text: `⚔️ Fantasy Bot • ${date} • Par ${interaction.user.tag}` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

    for (let i = 0; i < options.length; i++) {
      await msg.react(emojis[i]).catch(() => {});
    }

    try {
      await prisma.poll.create({
        data: {
          guildId: interaction.guildId,
          channelId: interaction.channelId,
          messageId: msg.id,
          question,
          options: JSON.stringify(options.map((opt, i) => ({ label: opt, emoji: emojis[i], votes: [] }))),
        },
      });
    } catch (err) {
      logger.debug(`sondage db: ${err.message}`);
    }
  },
};
