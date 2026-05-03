const { fetchLatestEventNews } = require("./news-fetcher");
const { postNewContentForGuild } = require("./content-poster");
const {
    getGuildConfig,
    hasPostedEventNewsLink,
    addPostedEventNewsLink
} = require("./config-services");

async function postNewEventNewsForGuild(client, guildId) {
    return postNewContentForGuild(client, guildId, {
        getGuildConfig,
        channelIdKey: "event_info_channel_id",
        fetchLatestContent: fetchLatestEventNews,
        hasPostedContentLink: hasPostedEventNewsLink,
        addPostedContentLink: addPostedEventNewsLink,
        missingChannelReason: "No event-info channel configured",
        missingConfiguredChannelReason: "Configured event-info channel not found",
        emptyFetchReason: "No event news found",
        noNewContentReason: "No new event news"
    });
}

module.exports = {
    postNewEventNewsForGuild
};