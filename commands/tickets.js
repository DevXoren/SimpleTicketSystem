const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('Открыть тикеты'),
    async execute(interaction) {
        console.log('Команда /tickets вызвана');

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'У вас нет прав для использования этой команды.', flags: 64 });
        }

        const embed = new EmbedBuilder()
            .setDescription('> **Нажмите** на **кнопку** ниже, чтобы **создать тикет**. \n> Наши **модераторы** помогут вам в **кратчайшие сроки**!')
            .setColor('#2F3136')
            .addFields(
                { name: 'Правила', value: '・Будьте вежливы.\n・Не спамьте.\n・Опишите проблему подробно.' },
            )
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('💌 Открыть тикет')
                    .setStyle(ButtonStyle.Success),
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Сообщение с тикетом отправлено.', flags: 64 });
    },
};