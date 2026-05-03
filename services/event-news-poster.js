const { fetchLatestEventNews } = require("./news-fetcher");
const {
    getGuildConfig,
    hasPostedEventNewsLink,
    addPostedEventNewsLink
} = require("./config-services");
const { postNewContentForGuild } = require("./content-poster");

async function postNewEventNewsForGuild(client, guildId) {
    return postNewContentForGuild(client, guildId, {
        getGuildConfig,
        channelIdKey: "eventInfoChannelId",
        fetchLatestContent: fetchLatestEventNews,
        hasPostedContentLink: hasPostedEventNewsLink,
        addPostedContentLink: addPostedEventNewsLink,
        missingChannelReason: "No event-info channel configured",
        missingConfiguredChannelReason: "Configured event-info channel not found",
        emptyFetchReason: "No event news fetched",
        noNewContentReason: "No new event news",
        contentType: "event"
    });
}

module.exports = {
    postNewEventNewsForGuild
};