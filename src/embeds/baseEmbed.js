// src/embeds/baseEmbed.js
const { EmbedBuilder } = require('discord.js');
const { COLORS, BOT_NAME } = require('../config/constants');

function createEmbed(color = COLORS.PRIMARY) {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: `⚔️ WESTSKY • ${date}` })
    .setTimestamp();
}

function successEmbed(title, description) {
  return createEmbed(COLORS.SUCCESS)
    .setTitle(`✅ ${title}`)
    .setDescription(description);
}

function warningEmbed(title, description) {
  return createEmbed(COLORS.DEEP)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description);
}

module.exports = { createEmbed, successEmbed, warningEmbed };
