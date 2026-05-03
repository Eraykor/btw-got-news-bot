const { EmbedBuilder } = require("discord.js");

function truncateText(value, maxLength) {
    if (!value) {
        return "No summary available.";
    }

    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength - 3)}...`;
}

function buildContentEmbed(contentItem) {
    const summary = truncateText(contentItem.summary, 450);

    const descriptionLines = [
        summary,
        "",
        `[View details](${contentItem.link})`
    ];

    const embed = new EmbedBuilder()
        .setTitle(contentItem.title)
        .setURL(contentItem.link)
        .setDescription(descriptionLines.join("\n"))
        .setFooter({
            text: contentItem.date || "No date available"
        });

    if (contentItem.image) {
        embed.setImage(contentItem.image);
    }

    return embed;
}

function extractSortableTimestamp(contentItem) {
    if (!contentItem.date) {
        return 0;
    }

    const parsedDate = Date.parse(contentItem.date);

    if (Number.isNaN(parsedDate)) {
        return 0;
    }

    return parsedDate;
}

async function postNewContentForGuild(client, guildId, options) {
    const {
        getGuildConfig,
        channelIdKey,
        fetchLatestContent,
        hasPostedContentLink,
        addPostedContentLink,
        missingChannelReason,
        missingConfiguredChannelReason,
        emptyFetchReason,
        noNewContentReason
    } = options;

    const guildConfig = await getGuildConfig(guildId);

    if (!guildConfig[channelIdKey]) {
        return {
            postedCount: 0,
            reason: missingChannelReason
        };
    }

    const targetChannel = await client.channels.fetch(guildConfig[channelIdKey]);

    if (!targetChannel) {
        return {
            postedCount: 0,
            reason: missingConfiguredChannelReason
        };
    }

    const contentItems = await fetchLatestContent();

    if (!contentItems || contentItems.length === 0) {
        return {
            postedCount: 0,
            reason: emptyFetchReason
        };
    }

    const unpostedContentItems = [];

    for (const contentItem of contentItems) {
        const alreadyPosted = await hasPostedContentLink(guildId, contentItem.link);

        if (!alreadyPosted) {
            unpostedContentItems.push(contentItem);
        }
    }

    if (unpostedContentItems.length === 0) {
        return {
            postedCount: 0,
            reason: noNewContentReason
        };
    }

    const sortedUnpostedContentItems = [...unpostedContentItems].sort((leftContentItem, rightContentItem) => {
        return extractSortableTimestamp(leftContentItem) - extractSortableTimestamp(rightContentItem);
    });

    for (const contentItem of sortedUnpostedContentItems) {
        const embed = buildContentEmbed(contentItem);

        await targetChannel.send({
            embeds: [embed]
        });

        await addPostedContentLink(guildId, contentItem.link);
    }

    return {
        postedCount: sortedUnpostedContentItems.length,
        reason: null
    };
}

module.exports = {
    postNewContentForGuild
};