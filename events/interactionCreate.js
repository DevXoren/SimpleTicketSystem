const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');

const categoryId = '';
const moderatorRoleId = '';

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'create_ticket') {
            db.get(`SELECT * FROM tickets WHERE userId = ? AND closed = 0`, [interaction.user.id], async (err, row) => {
                if (err) return console.error(err.message);
                if (row) {
                    await interaction.reply({ content: 'У вас уже есть активный тикет!', ephemeral: true });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setColor('#2F3136')
                    .setTitle('Тикеты')
                    .setDescription('Подтвердите создание тикета.');

                const rowTicket = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('confirm_ticket').setLabel('Подтверждаю').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('cancel_ticket').setLabel('Отменить').setStyle(ButtonStyle.Secondary),
                    );

                await interaction.reply({ embeds: [embed], components: [rowTicket], ephemeral: true });
            });
        }

        if (interaction.customId === 'confirm_ticket') {
            await interaction.update({ content: 'Тикет создан.', embeds: [], components: [] });

            const channel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: categoryId,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: moderatorRoleId,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.CreatePublicThreads,
                            PermissionFlagsBits.SendMessagesInThreads,
                        ],
                        deny: [
                            PermissionFlagsBits.UseApplicationCommands,
                            PermissionFlagsBits.UseExternalEmojis,
                            PermissionFlagsBits.UseExternalStickers,
                        ],
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.CreatePublicThreads,
                            PermissionFlagsBits.SendMessagesInThreads,
                        ],
                        deny: [
                            PermissionFlagsBits.UseApplicationCommands,
                            PermissionFlagsBits.UseExternalEmojis,
                            PermissionFlagsBits.UseExternalStickers,
                        ],
                    },
                ],
            });

            const embed = new EmbedBuilder()
                .setColor('#2F3136')
                .setDescription('> Вы **успешно** открыли тикет! \n> Вам обязательно **скоро** помогут!')

            const rowTicketConfirm = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('close_ticket').setLabel('👀 Закрыть тикет').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('ticket_owner').setLabel('📘 Владелец тикета').setStyle(ButtonStyle.Secondary),
                );

            await channel.send({ content: `<@${interaction.user.id}> <@&${moderatorRoleId}>`, embeds: [embed], components: [rowTicketConfirm] });

            db.run(`INSERT INTO tickets (userId, channelId, createdAt, closed) VALUES (?, ?, ?, ?)`, [interaction.user.id, channel.id, new Date().toISOString(), 0]);
        }

        if (interaction.customId === 'ticket_owner') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && !interaction.member.roles.cache.has(moderatorRoleId)) {
                await interaction.reply({ content: 'Вы не можете использовать эту кнопку.', ephemeral: true });
                return;
            }

            db.get(`SELECT * FROM tickets WHERE channelId = ?`, [interaction.channel.id], async (err, ticketData) => {
                if (err || !ticketData) {
                    await interaction.reply({ content: 'Не удалось найти владельца тикета.', ephemeral: true });
                    return;
                }

                const owner = await interaction.guild.members.fetch(ticketData.userId).catch(() => null);
                if (!owner) {
                    await interaction.reply({ content: 'Владелец тикета не найден.', ephemeral: true });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setColor('#2F3136')
                    .setTitle(`—・Информация о — ${owner.displayName}`)
                    .setThumbnail(owner.user.displayAvatarURL({ dynamic: true, size: 512 }))
                    .addFields(
                        { name: 'Владелец тикета', value: `<@${owner.id}>` },
                        { name: '', value: '', inline: false },
                        { name: 'Дата регистрации', value: `<t:${Math.floor(owner.user.createdTimestamp / 1000)}:F>`, inline: true },
                        { name: 'Дата входа на сервер', value: `<t:${Math.floor(owner.joinedAt.getTime() / 1000)}:F>`, inline: true }
                    )                                   
                    .setFooter({ text: `ID: ${owner.id}` });

                const avatarURL = owner.user.displayAvatarURL({ dynamic: true, size: 1024 });

                const rowLinks = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setLabel('Аватар').setURL(avatarURL).setStyle(ButtonStyle.Link),
                    );

                await interaction.reply({ embeds: [embed], components: [rowLinks], ephemeral: true });
            });
        }

        if (interaction.customId === 'close_ticket') {
            const embed = new EmbedBuilder()
                .setColor('#2F3136')
                .setTitle('Тикеты')
                .setDescription('Вы уверены, что хотите закрыть этот тикет?');

            const rowClose = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('confirm_close').setLabel('Да, закрыть').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('cancel_close').setLabel('Нет, отменить').setStyle(ButtonStyle.Secondary),
                );

            await interaction.reply({ embeds: [embed], components: [rowClose], ephemeral: true });
        }

        if (interaction.customId === 'confirm_close') {
            await interaction.update({ content: 'Тикет будет удален через 5 секунд...', embeds: [], components: [], ephemeral: true });

            const channelId = interaction.channel.id;

            setTimeout(async () => {
                const channel = interaction.guild.channels.cache.get(channelId);
                if (channel) await channel.delete();

                db.run(`UPDATE tickets SET closed = 1 WHERE channelId = ?`, [channelId]);
            }, 5000);
        }

        if (interaction.customId === 'cancel_close') {
            await interaction.update({ content: 'Вы отменили закрытие тикета.', embeds: [], components: [], ephemeral: true });
        }

        if (interaction.customId === 'cancel_ticket') {
            await interaction.update({ content: 'Вы отменили создание тикета.', embeds: [], components: [], ephemeral: true });
        }
    },
};
