// src/commands/admin/dmall.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed, warningEmbed } = require('../../embeds/baseEmbed');
const { confirmRow } = require('../../components/buttons');
const { COLORS, LIMITS } = require('../../config/constants');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dmall')
    .setDescription('Envoyer un message privé à tous les membres')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt => opt.setName('message').setDescription('Message à envoyer').setRequired(true))
    .addRoleOption(opt => opt.setName('rôle').setDescription('Limiter à un rôle spécifique'))
    .addBooleanOption(opt => opt.setName('embed').setDescription('Envoyer en format embed')),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [errorEmbed('Permission manquante', 'Tu dois être administrateur.')], ephemeral: true });
    }

    const message = interaction.options.getString('message');
    const roleFilter = interaction.options.getRole('rôle');
    const useEmbed = interaction.options.getBoolean('embed') ?? false;

    await interaction.guild.members.fetch();
    let members = interaction.guild.members.cache.filter(m => !m.user.bot);
    if (roleFilter) members = members.filter(m => m.roles.cache.has(roleFilter.id));
    const total = members.size;

    const row = confirmRow('confirm_dmall', 'cancel_dmall', '📩 Envoyer', '❌ Annuler');
    const reply = await interaction.reply({
      embeds: [warningEmbed('Confirmation', `Tu vas envoyer un message à **${total}** membre(s)${roleFilter ? ` avec le rôle ${roleFilter.name}` : ''}.\n\n**Aperçu :** ${message.slice(0, 100)}`)],
      components: [row],
      ephemeral: true,
      fetchReply: true,
    });

    const filter = i => i.user.id === interaction.user.id;
    let btn;
    try {
      btn = await reply.awaitMessageComponent({ filter, time: 15000 });
    } catch {
      return interaction.editReply({ embeds: [errorEmbed('Timeout', 'Délai dépassé.')], components: [] });
    }

    if (btn.customId === 'cancel_dmall') {
      return btn.update({ embeds: [successEmbed('Annulé', 'Envoi annulé.')], components: [] });
    }

    await btn.update({ embeds: [warningEmbed('Envoi en cours...', `⏳ Envoi à ${total} membres...`)], components: [] });

    let sent = 0, failed = 0;
    const memberArray = [...members.values()];

    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    for (let i = 0; i < memberArray.length; i++) {
      const m = memberArray[i];
      try {
        if (useEmbed) {
          const dmEmbed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(`📩 Message de ${interaction.guild.name}`)
            .setDescription(message)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: `⚔️ WESTSKY • ${date}` });
          await m.send({ embeds: [dmEmbed] });
        } else {
          await m.send({ content: message });
        }
        sent++;
      } catch {
        failed++;
      }

      // Mettre à jour la progression tous les 50 membres
      if (i > 0 && i % 50 === 0) {
        await interaction.editReply({
          embeds: [warningEmbed('Envoi en cours...', `⏳ Progression: ${i}/${total}\n✅ Envoyés: ${sent}\n❌ Échoués: ${failed}`)],
        }).catch(() => {});
      }

      await new Promise(r => setTimeout(r, LIMITS.DMALL_DELAY));
    }

    await interaction.editReply({
      embeds: [new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle('📩 Envoi terminé')
        .addFields(
          { name: '✅ Envoyés', value: `${sent}`, inline: true },
          { name: '❌ Échoués (DMs fermés)', value: `${failed}`, inline: true },
          { name: '⏭️ Ignorés (bots)', value: `${interaction.guild.members.cache.size - total - (roleFilter ? 0 : 0)}`, inline: true },
        )
        .setFooter({ text: `⚔️ WESTSKY • ${date}` })
      ],
    });
    logger.info(`dmall: ${sent} envoyés, ${failed} échoués par ${interaction.user.tag}`);
  },
};
