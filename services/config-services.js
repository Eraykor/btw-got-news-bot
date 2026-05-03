const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "..", "config.json");

function createDefaultConfig() {
    return {
        guilds: {}
    };
}

function readConfig() {
    if (!fs.existsSync(configPath)) {
        return createDefaultConfig();
    }

    const rawConfig = fs.readFileSync(configPath, "utf8");

    if (!rawConfig || !rawConfig.trim()) {
        return createDefaultConfig();
    }

    return JSON.parse(rawConfig);
}

function writeConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
}

function ensureGuildConfig(config, guildId) {
    if (!config.guilds[guildId]) {
        config.guilds[guildId] = {};
    }

    if (!Array.isArray(config.guilds[guildId].postedGameNewsLinks)) {
        config.guilds[guildId].postedGameNewsLinks = [];
    }

    if (!Array.isArray(config.guilds[guildId].postedEventNewsLinks)) {
        config.guilds[guildId].postedEventNewsLinks = [];
    }

    if (!Array.isArray(config.guilds[guildId].postedGameCodes)) {
        config.guilds[guildId].postedGameCodes = [];
    }

    return config.guilds[guildId];
}

function getGuildConfig(guildId) {
    const config = readConfig();
    const guildConfig = ensureGuildConfig(config, guildId);

    writeConfig(config);

    return guildConfig;
}

function updateGuildConfig(guildId, updater) {
    const config = readConfig();
    const guildConfig = ensureGuildConfig(config, guildId);

    updater(guildConfig);

    writeConfig(config);
}

function getPostedGameNewsLinks(guildId) {
    const guildConfig = getGuildConfig(guildId);
    return guildConfig.postedGameNewsLinks;
}

function addPostedGameNewsLink(guildId, newsLink) {
    updateGuildConfig(guildId, (guildConfig) => {
        if (!guildConfig.postedGameNewsLinks.includes(newsLink)) {
            guildConfig.postedGameNewsLinks.push(newsLink);
        }
    });
}

function hasPostedGameNewsLink(guildId, newsLink) {
    const postedGameNewsLinks = getPostedGameNewsLinks(guildId);
    return postedGameNewsLinks.includes(newsLink);
}

function getPostedEventNewsLinks(guildId) {
    const guildConfig = getGuildConfig(guildId);
    return guildConfig.postedEventNewsLinks;
}

function addPostedEventNewsLink(guildId, newsLink) {
    updateGuildConfig(guildId, (guildConfig) => {
        if (!guildConfig.postedEventNewsLinks.includes(newsLink)) {
            guildConfig.postedEventNewsLinks.push(newsLink);
        }
    });
}

function hasPostedEventNewsLink(guildId, newsLink) {
    const postedEventNewsLinks = getPostedEventNewsLinks(guildId);
    return postedEventNewsLinks.includes(newsLink);
}

function getPostedGameCodes(guildId) {
    const guildConfig = getGuildConfig(guildId);
    return guildConfig.postedGameCodes;
}

function addPostedGameCode(guildId, code) {
    updateGuildConfig(guildId, (guildConfig) => {
        if (!guildConfig.postedGameCodes.includes(code)) {
            guildConfig.postedGameCodes.push(code);
        }
    });
}

function hasPostedGameCode(guildId, code) {
    const postedGameCodes = getPostedGameCodes(guildId);
    return postedGameCodes.includes(code);
}

module.exports = {
    readConfig,
    writeConfig,
    getGuildConfig,
    updateGuildConfig,
    getPostedGameNewsLinks,
    addPostedGameNewsLink,
    hasPostedGameNewsLink,
    getPostedEventNewsLinks,
    addPostedEventNewsLink,
    hasPostedEventNewsLink,
    getPostedGameCodes,
    addPostedGameCode,
    hasPostedGameCode
};