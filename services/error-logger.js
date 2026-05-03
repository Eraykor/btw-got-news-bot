const { getGuildConfig } = require("./config-services");

async function sendErrorLog(client, guildId, context, error) {
    try {
        if (!guildId) {
            return;
        }

        const guildConfig = await getGuildConfig(guildId);

        if (!guildConfig?.error_log_channel_id) {
            return;
        }

        const targetChannel = await client.channels.fetch(guildConfig.error_log_channel_id);

        if (!targetChannel) {
            return;
        }

        const errorStack = error?.stack || String(error);
        const truncatedErrorStack = errorStack.length > 1800
            ? `${errorStack.slice(0, 1797)}...`
            : errorStack;

        await targetChannel.send({
            content: [
                "❌ **Bot error detected**",
                `**Context:** ${context}`,
                `**Time:** ${new Date().toISOString()}`,
                "```",
                truncatedErrorStack,
                "```"
            ].join("\n")
        });
    } catch (sendError) {
        console.error("Failed to send error log to Discord channel:", sendError);
    }
}

module.exports = {
    sendErrorLog
};