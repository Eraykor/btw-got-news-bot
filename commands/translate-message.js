const {
    ContextMenuCommandBuilder,
    ApplicationCommandType
} = require("discord.js");
const { translateText } = require("../services/translation-service");
const { getUserTranslationLanguage } = require("../services/config-services");

function truncateText(value, maxLength) {
    if (!value) {
        return "";
    }

    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength - 3)}...`;
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName("Translate message")
        .setType(ApplicationCommandType.Message),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const targetMessage = interaction.targetMessage;
        const targetLanguage =
            await getUserTranslationLanguage(interaction.user.id)
            || process.env.TRANSLATION_TARGET_LANGUAGE
            || "fr";

        if (!targetMessage) {
            await interaction.editReply({
                content: "❌ No message was found to translate."
            });
            return;
        }

        if (!targetMessage.content || !targetMessage.content.trim()) {
            await interaction.editReply({
                content: "❌ This message does not contain text to translate."
            });
            return;
        }

        const translationResult = await translateText(
            targetMessage.content,
            targetLanguage
        );

        const originalText = truncateText(targetMessage.content, 1500);
        const translatedText = truncateText(translationResult.translatedText, 1500);

        await interaction.editReply({
            content: [
                "🌍 **Translated message**",
                `**Author:** ${targetMessage.author?.tag || "Unknown"}`,
                `**Target language:** ${targetLanguage}`,
                "",
                "**Original:**",
                originalText,
                "",
                "**Translation:**",
                translatedText
            ].join("\n")
        });
    }
};