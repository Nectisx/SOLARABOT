// src/commands/moderation/infractions.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getWarnings, getModLogs } = require('../../services/moderationService');
const { COLORS } = require('../../config/constants');
const prisma = require('../../database/prisma');

const ACTION_EMOJI = {
  ban: '🔨', tempban: '⏰🔨', kick: '👢', tempkick: '⏰👢',
  mute: '🔇', timeout: '⏰', warn: '⚠️', unmute: '🔊',
  unban: '🔓', softban: '🔨', purge: '🗑️',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infractions')
    .setDescription('Voir toutes les infractions d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur');
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const [warns, modlogs, tempbans] = await Promise.all([
      getWarnings(interaction.guildId, targetUser.id),
      getModLogs(interaction.guildId, targetUser.id, 15),
      prisma.tempBan.findMany({
        where: { guildId: interaction.guildId, userId: targetUser.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const activeTempBans = tempbans.filter(tb => !tb.unbanned && new Date(tb.expiresAt) > new Date());

    const embed = new EmbedBuilder()
      .setColor(warns.length + modlogs.length > 0 ? COLORS.DANGER : COLORS.SUCCESS)
      .setTitle(`🗂️ Infractions — ${targetUser.tag}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `⚔️ WestSky • ${date}` })
      .setTimestamp();

    // Résumé rapide
    embed.addFields({
      name: '📊 Résumé',
      value: [
        `⚠️ Avertissements : **${warns.length}**`,
        `📋 Actions de mod : **${modlogs.length}**`,
        activeTempBans.length > 0 ? `🚫 Ban temp actif : **OUI** (expire <t:${Math.floor(new Date(activeTempBans[0].expiresAt).getTime() / 1000)}:R>)` : '',
      ].filter(Boolean).join('\n'),
      inline: false,
    });

    // Derniers avertissements
    if (warns.length > 0) {
      const warnText = warns.slice(0, 5).map((w, i) =>
        `**${i + 1}.** ${w.reason} — <t:${Math.floor(new Date(w.createdAt).getTime() / 1000)}:R>\n> ID: \`${w.id}\``
      ).join('\n');
      embed.addFields({
        name: `⚠️ Avertissements (${warns.length})`,
        value: warnText + (warns.length > 5 ? `\n*... et ${warns.length - 5} de plus*` : ''),
        inline: false,
      });
    }

    // Historique de modération
    if (modlogs.length > 0) {
      const logText = modlogs.slice(0, 8).map(l =>
        `${ACTION_EMOJI[l.action] || '📋'} **${l.action.toUpperCase()}** — par <@${l.modId}> — <t:${Math.floor(new Date(l.createdAt).getTime() / 1000)}:R>\n> ${l.reason || 'Aucune raison'}`
      ).join('\n');
      embed.addFields({
        name: `📋 Historique mod (${modlogs.length})`,
        value: logText + (modlogs.length > 8 ? `\n*... et ${modlogs.length - 8} de plus*` : ''),
        inline: false,
      });
    }

    if (warns.length === 0 && modlogs.length === 0) {
      embed.setDescription('✅ Aucune infraction trouvée pour ce membre.');
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
