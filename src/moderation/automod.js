// src/moderation/automod.js
const { PermissionFlagsBits } = require('discord.js');
const { addModLog } = require('../services/moderationService');
const { buildModEmbed } = require('../embeds/moderationEmbed');
const prisma = require('../database/prisma');
const logger = require('../utils/logger');

const MUTE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Liens Discord interdits — sauf discord.gg/westsky
const INVITE_REGEX = /discord(?:\.gg|app\.com\/invite|\.com\/invite)\/([\w-]+)/gi;
const ALLOWED_CODES = ['westsky'];

// Insultes françaises claires (gaming)
const INSULTS = [
  'connard', 'connasse', 'salope', 'pute', 'enculé', 'encule', 'enculer',
  'fils de pute', 'fdp', 'va te faire foutre', 'nique ta mère', 'nique ta mere',
  'ntm', 'batard', 'bâtard', 'va te faire', 'ta gueule',
  'pédé', 'pede', 'pd', 'pédale', 'pedale', 'tapette',
  'attardé', 'attarde', 'mongol', 'retardé', 'retarde',
  'grosse pute', 'sale pute', 'sale pd',
];

// Retourne true si le membre ne doit pas être auto-modéré
async function isBypassed(message) {
  if (!message.member) return true;
  if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (message.guild.ownerId === message.author.id) return true;
  const config = await prisma.guildConfig.findUnique({ where: { guildId: message.guild.id } });
  if (config?.modRoleId && message.member.roles.cache.has(config.modRoleId)) return true;
  if (config?.adminRoleId && message.member.roles.cache.has(config.adminRoleId)) return true;
  return false;
}

async function applyAutoMute(message, reason) {
  try {
    const member = message.member || await message.guild.members.fetch(message.author.id).catch(() => null);
    if (!member) return;
    await member.timeout(MUTE_DURATION_MS, reason);
    await addModLog(message.guild.id, message.author.id, message.client.user.id, 'mute', `[AutoMod] ${reason}`, 300);

    const config = await prisma.guildConfig.findUnique({ where: { guildId: message.guild.id } });
    if (config?.logChannelId) {
      const logCh = await message.guild.channels.fetch(config.logChannelId).catch(() => null);
      if (logCh) {
        const botMod = { id: message.client.user.id, tag: 'AutoMod ⚙️', user: { tag: 'AutoMod ⚙️' } };
        await logCh.send({ embeds: [buildModEmbed('mute', botMod, member, `[AutoMod] ${reason}`, { duration: '5 minutes' })] }).catch(() => {});
      }
    }
  } catch (err) {
    logger.warn(`automod applyMute: ${err.message}`);
  }
}

async function sendTempWarning(channel, content) {
  const msg = await channel.send({ content }).catch(() => null);
  if (msg) setTimeout(() => msg.delete().catch(() => {}), 8000);
}

// Anti-publicité : supprime les invites Discord non autorisées
async function checkAntiPub(message) {
  INVITE_REGEX.lastIndex = 0;
  const matches = [...message.content.matchAll(INVITE_REGEX)];
  if (matches.length === 0) return false;

  const hasIllegal = matches.some(m => !ALLOWED_CODES.includes(m[1].toLowerCase()));
  if (!hasIllegal) return false;

  if (await isBypassed(message)) return false;

  await message.delete().catch(() => {});
  await applyAutoMute(message, 'Publicité Discord interdite');
  await sendTempWarning(message.channel,
    `🚫 ${message.author}, les publicités Discord sont **interdites** sur ce serveur ! Tu as été mis en sourdine **5 minutes**.`
  );
  logger.info(`[AutoMod] Pub supprimée — ${message.author.tag} dans #${message.channel.name}`);
  return true;
}

// Anti-insulte : détecte les insultes et mute 5 min
async function checkAntiInsult(message) {
  const normalized = message.content
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');

  const found = INSULTS.find(insult => {
    const norm = insult.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return normalized.includes(norm);
  });
  if (!found) return false;

  if (await isBypassed(message)) return false;

  await message.delete().catch(() => {});
  await applyAutoMute(message, `Insulte détectée`);
  await sendTempWarning(message.channel,
    `🤬 ${message.author}, les insultes sont **interdites** sur ce serveur ! Tu as été mis en sourdine **5 minutes**.`
  );
  logger.info(`[AutoMod] Insulte — ${message.author.tag}: "${found}"`);
  return true;
}

module.exports = { checkAntiPub, checkAntiInsult, isBypassed, applyAutoMute };
