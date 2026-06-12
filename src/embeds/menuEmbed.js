// src/embeds/menuEmbed.js
const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../config/constants');

const categories = {
  giveaway: {
    label: '🎁 Giveaways',
    color: COLORS.PRIMARY,
    description: 'Créer, gérer et consulter les giveaways du serveur.',
    commands: [
      { name: '/giveaway create', desc: 'Créer un nouveau giveaway' },
      { name: '/giveaway end', desc: 'Terminer un giveaway manuellement' },
      { name: '/giveaway reroll', desc: 'Retirer un gagnant' },
      { name: '/giveaway cancel', desc: 'Annuler un giveaway actif' },
      { name: '/giveaway list', desc: 'Lister les giveaways actifs' },
      { name: '/giveaway info', desc: 'Infos détaillées d\'un giveaway' },
      { name: '/giveaway pause', desc: 'Mettre en pause un giveaway' },
      { name: '/giveaway resume', desc: 'Reprendre un giveaway' },
    ],
    perms: 'Manage Guild',
  },
  moderation: {
    label: '🛡️ Modération',
    color: COLORS.DANGER,
    description: 'Sanctions, logs et avertissements pour gérer ton serveur.',
    commands: [
      { name: '/ban', desc: 'Bannir un membre' },
      { name: '/kick', desc: 'Expulser un membre' },
      { name: '/mute / /unmute', desc: 'Muet / démuter un membre' },
      { name: '/timeout', desc: 'Timeout un membre' },
      { name: '/warn', desc: 'Avertir un membre' },
      { name: '/warnings', desc: 'Voir les avertissements' },
      { name: '/purge', desc: 'Supprimer des messages en masse' },
      { name: '/modlogs', desc: 'Voir l\'historique de modération' },
    ],
    perms: 'Kick Members, Ban Members, Manage Messages',
  },
  welcome: {
    label: '👋 Bienvenue',
    color: COLORS.SUCCESS,
    description: 'Configurer l\'accueil des nouveaux membres.',
    commands: [
      { name: '/welcome setup', desc: 'Configurer le salon de bienvenue' },
      { name: '/welcome channel', desc: 'Définir le salon' },
      { name: '/welcome message', desc: 'Modifier le message' },
      { name: '/welcome test', desc: 'Tester le message de bienvenue' },
      { name: '/welcome disable', desc: 'Désactiver la bienvenue' },
    ],
    perms: 'Manage Guild',
  },
  invites: {
    label: '📊 Invitations',
    color: COLORS.SECONDARY,
    description: 'Classement et statistiques des invitations.',
    commands: [
      { name: '/invites user', desc: 'Stats d\'un membre' },
      { name: '/invites leaderboard', desc: 'Classement des invitations' },
      { name: '/invites add', desc: 'Ajouter des invitations bonus' },
      { name: '/invites remove', desc: 'Retirer des invitations' },
      { name: '/invites reset', desc: 'Réinitialiser les stats' },
    ],
    perms: 'Manage Guild (pour modifier)',
  },
  reglement: {
    label: '📜 Règlement',
    color: COLORS.LIGHT,
    description: 'Configurer le règlement avec acceptation automatique.',
    commands: [
      { name: '/reglement setup', desc: 'Créer le message de règlement' },
      { name: '/reglement edit', desc: 'Modifier le règlement' },
      { name: '/reglement disable', desc: 'Désactiver le règlement' },
      { name: '/reglement status', desc: 'Voir la configuration actuelle' },
    ],
    perms: 'Manage Guild',
  },
  admin: {
    label: '⚙️ Administration',
    color: COLORS.DEEP,
    description: 'Outils d\'administration avancés pour les propriétaires.',
    commands: [
      { name: '/dmall', desc: 'Envoyer un DM à tous les membres' },
      { name: '/announce', desc: 'Faire une annonce' },
      { name: '/config', desc: 'Configurer le bot' },
      { name: '/logs', desc: 'Gérer les logs' },
      { name: '/say', desc: 'Faire parler le bot' },
      { name: '/embed', desc: 'Créer un embed personnalisé' },
    ],
    perms: 'Administrator',
  },
  community: {
    label: '📈 Communauté',
    color: COLORS.SUCCESS,
    description: 'Sondages, suggestions, tickets et système de niveaux.',
    commands: [
      { name: '/sondage', desc: 'Créer un sondage' },
      { name: '/suggestion', desc: 'Soumettre une suggestion' },
      { name: '/ticket', desc: 'Ouvrir un ticket de support' },
      { name: '/level voir', desc: 'Voir son niveau' },
      { name: '/level setup', desc: 'Configurer le salon de notifications de niveau' },
      { name: '/rank', desc: 'Classement XP' },
    ],
    perms: 'Selon la commande',
  },
};

function buildMainMenuEmbed() {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('⚔️ WESTSKY — Menu Principal')
    .setDescription(
      'Bienvenue dans le panneau de commande du **WESTSKY** !\n\n' +
      'Utilise le menu déroulant ci-dessous pour explorer les différentes catégories de commandes.\n\n' +
      Object.values(categories).map(c => `${c.label}`).join(' • ')
    )
    .setFooter({ text: `⚔️ WESTSKY • ${date}` })
    .setTimestamp();
}

function buildCategoryEmbed(categoryKey) {
  const cat = categories[categoryKey];
  if (!cat) return null;
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return new EmbedBuilder()
    .setColor(cat.color)
    .setTitle(cat.label)
    .setDescription(cat.description)
    .addFields(
      {
        name: '📋 Commandes disponibles',
        value: cat.commands.map(c => `\`${c.name}\` — ${c.desc}`).join('\n'),
      },
      { name: '🔐 Permissions requises', value: cat.perms },
    )
    .setFooter({ text: `⚔️ WESTSKY • ${date}` })
    .setTimestamp();
}

module.exports = { buildMainMenuEmbed, buildCategoryEmbed, categories };
