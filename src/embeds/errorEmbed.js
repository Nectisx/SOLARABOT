// src/embeds/errorEmbed.js
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../config/constants');

function errorEmbed(title, description) {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return new EmbedBuilder()
    .setColor(COLORS.DANGER)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setFooter({ text: `⚔️ WESTSKY • ${date}` })
    .setTimestamp();
}

function permissionError(missing) {
  return errorEmbed('Permission manquante', `Tu n'as pas la permission requise : **${missing}**`);
}

function hierarchyError() {
  return errorEmbed('Hiérarchie invalide', 'Tu ne peux pas modérer un membre avec un rôle supérieur ou égal au tien.');
}

function botTargetError() {
  return errorEmbed('Action impossible', 'Tu ne peux pas utiliser cette commande sur un bot.');
}

function cooldownError(seconds) {
  return errorEmbed('Cooldown actif', `Attends encore **${seconds}s** avant de réutiliser cette commande.`);
}

module.exports = { errorEmbed, permissionError, hierarchyError, botTargetError, cooldownError };
