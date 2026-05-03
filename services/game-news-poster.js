const { fetchLatestNews } = require("./news-fetcher");
const { postNewContentForGuild } = require("./content-poster");
const {
    getGuildConfig,
    hasPostedGameNewsLink,
    addPostedGameNewsLink
} = require("./config-services");

async function postNewGameNewsForGuild(client, guildId) {
    return postNewContentForGuild(client, guildId, {
        getGuildConfig,
        channelIdKey: "game_info_channel_id",
        fetchLatestContent: fetchLatestNews,
        hasPostedContentLink: hasPostedGameNewsLink,
        addPostedContentLink: addPostedGameNewsLink,
        missingChannelReason: "No game-info channel configured",
        missingConfiguredChannelReason: "Configured game-info channel not found",
        emptyFetchReason: "No game news found",
        noNewContentReason: "No new game news"
    });
}

module.exports = {
    postNewGameNewsForGuild
};