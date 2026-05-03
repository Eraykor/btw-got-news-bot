const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { postNewEventNewsForGuild } = require("../services/event-news-poster");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("post-latest-events")
        .setDescription("Post only the new event news that were not already sent.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const result = await postNewEventNewsForGuild(
            interaction.client,
            interaction.guildId
        );

        if (result.postedCount === 0) {
            await interaction.editReply({
                content: `ℹ️ ${result.reason || "No new event news to post."}`
            });
            return;
        }

        await interaction.editReply({
            content: `✅ Posted ${result.postedCount} new event news item(s).`
        });
    }
};