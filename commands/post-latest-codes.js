const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { postNewGameCodesForGuild } = require("../services/game-code-poster");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("post-latest-codes")
        .setDescription("Post only the new game codes that were not already sent.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const result = await postNewGameCodesForGuild(
            interaction.client,
            interaction.guildId
        );

        if (result.postedCount === 0) {
            await interaction.editReply({
                content: `ℹ️ ${result.reason || "No new game codes to post."}`
            });
            return;
        }

        await interaction.editReply({
            content: `✅ Posted ${result.postedCount} new game code(s).`
        });
    }
};