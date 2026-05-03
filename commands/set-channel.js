const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setGuildChannel } = require("../services/config-services");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("set-channel")
        .setDescription("Configure the bot channels for this server.")
        .addStringOption((option) =>
            option
                .setName("type")
                .setDescription("The channel type to configure.")
                .setRequired(true)
                .addChoices(
                    { name: "game-info", value: "game-info" },
                    { name: "event-info", value: "event-info" },
                    { name: "error-log", value: "error-log" },
                    { name: "game-code", value: "game-code" }
                )
        )
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("The channel to use.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const channelType = interaction.options.getString("type");
        const selectedChannel = interaction.options.getChannel("channel");

        await setGuildChannel(interaction.guildId, channelType, selectedChannel.id);

        await interaction.editReply({
            content: `✅ Channel \`${channelType}\` has been set to ${selectedChannel}.`
        });
    }
};