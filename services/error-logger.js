const { getGuildConfig } = require("./config-services");

async function sendErrorLog(client, guildId, title, error) {
    try {
        const guildConfig = getGuildConfig(guildId);

        if (!guildConfig.errorLogChannelId) {
            return;
        }

        const errorChannel = await client.channels.fetch(guildConfig.errorLogChannelId);

        if (!errorChannel) {
            return;
        }

        const errorMessage = error instanceof Error
            ? error.stack || error.message
            : String(error);

        const truncatedErrorMessage = errorMessage.length > 1800
            ? `${errorMessage.slice(0, 1797)}...`
            : errorMessage;

        await errorChannel.send({
            content: [
                "❌ **Bot error detected**",
                `**Context:** ${title}`,
                `**Time:** ${new Date().toISOString()}`,
                "```",
                truncatedErrorMessage,
                "```"
            ].join("\n")
        });
    } catch (loggingError) {
        console.error("Failed to send error log to Discord channel:", loggingError);
    }
}

module.exports = {
    sendErrorLog
};