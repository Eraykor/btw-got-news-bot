const { EmbedBuilder } = require("discord.js");
const { readConfig, hasPostedGameCode, addPostedGameCode } = require("./config-services");
const { fetchLatestGameCodes } = require("./game-code-fetcher-playwright");

const fallbackThumbnailUrl = process.env.GAME_CODE_THUMBNAIL_URL || null;

function buildGameCodeEmbed(gameCode) {
    const embedLines = [
        `**Code:** \`${gameCode.code}\``,
        gameCode.publishedAt ? `**Released:** ${gameCode.publishedAt}` : null,
        gameCode.expiresAt ? `**Expires:** ${gameCode.expiresAt}` : `**Expires:** Unknown`,
        "",
        `[View source post](${gameCode.link})`
    ].filter(Boolean);

    const embed = new EmbedBuilder()
        .setColor(0xd4af37)
        .setTitle("🎁 New Gift Code")
        .setURL(gameCode.link)
        .setDescription(embedLines.join("\n"))
        .setFooter({
            text: "Game of Thrones: Winter is Coming"
        });

    const thumbnailUrl = gameCode.image || fallbackThumbnailUrl;

    if (thumbnailUrl) {
        embed.setThumbnail(thumbnailUrl);
    }

    return embed;
}

async function postNewGameCodesForGuild(client, guildId) {
    const config = readConfig();
    const guildConfig = config.guilds?.[guildId];

    if (!guildConfig) {
        return {
            postedCount: 0,
            reason: "Guild is not configured"
        };
    }

    if (!guildConfig.gameCodeChannelId) {
        return {
            postedCount: 0,
            reason: "No game-code channel configured"
        };
    }

    const targetChannel = await client.channels.fetch(guildConfig.gameCodeChannelId);

    if (!targetChannel) {
        return {
            postedCount: 0,
            reason: "Configured game-code channel not found"
        };
    }

    const codeItems = await fetchLatestGameCodes();

    if (!codeItems || codeItems.length === 0) {
        return {
            postedCount: 0,
            reason: "No codes found"
        };
    }

    const newCodeItems = codeItems.filter((codeItem) => {
        return !hasPostedGameCode(guildId, codeItem.code);
    });

    if (newCodeItems.length === 0) {
        return {
            postedCount: 0,
            reason: "No new codes"
        };
    }

    let postedCount = 0;

    for (const codeItem of newCodeItems.reverse()) {
        const embed = buildGameCodeEmbed(codeItem);

        await targetChannel.send({
            embeds: [embed]
        });

        addPostedGameCode(guildId, codeItem.code);
        postedCount++;
    }

    return {
        postedCount,
        reason: postedCount > 0 ? "Posted successfully" : "No new codes"
    };
}

module.exports = {
    postNewGameCodesForGuild
};