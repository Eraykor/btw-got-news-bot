const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { postNewGameNewsForGuild } = require("../services/game-news-poster");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("post-latest-news")
        .setDescription("Post only the new game news that were not already sent.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const result = await postNewGameNewsForGuild(
            interaction.client,
            interaction.guildId
        );

        if (result.postedCount === 0) {
            await interaction.editReply({
                content: `ℹ️ ${result.reason || "No new game news to post."}`
            });
            return;
        }

        await interaction.editReply({
            content: `✅ Posted ${result.postedCount} new game news item(s).`
        });
    }
};