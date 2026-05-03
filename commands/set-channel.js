const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "..", "config.json");

function readConfig() {
    if (!fs.existsSync(configPath)) {
        return { guilds: {} };
    }

    const rawConfig = fs.readFileSync(configPath, "utf8");
    return JSON.parse(rawConfig);
}

function writeConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
}

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
        const channelType = interaction.options.getString("type");
        const selectedChannel = interaction.options.getChannel("channel");
        const guildId = interaction.guildId;

        const config = readConfig();

        if (!config.guilds[guildId]) {
            config.guilds[guildId] = {};
        }

        if (channelType === "game-info") {
            config.guilds[guildId].gameInfoChannelId = selectedChannel.id;
        }

        if (channelType === "event-info") {
            config.guilds[guildId].eventInfoChannelId = selectedChannel.id;
        }

        if (channelType === "error-log") {
            config.guilds[guildId].errorLogChannelId = selectedChannel.id;
        }

        if (channelType === "game-code") {
            config.guilds[guildId].gameCodeChannelId = selectedChannel.id;
        }

        writeConfig(config);

        await interaction.reply({
            content: `✅ Channel \`${channelType}\` has been set to ${selectedChannel}.`,
            flags: 64
        });
    }
};