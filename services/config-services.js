const { supabase } = require("./supabase-client");

async function getGuildConfig(guildId) {
    const { data, error } = await supabase
        .from("guild_config")
        .select("*")
        .eq("guild_id", guildId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        return {
            guild_id: guildId,
            game_info_channel_id: null,
            event_info_channel_id: null,
            error_log_channel_id: null,
            game_code_channel_id: null
        };
    }

    return data;
}

async function setGuildChannel(guildId, channelType, channelId) {
    const payload = {
        guild_id: guildId,
        updated_at: new Date().toISOString()
    };

    if (channelType === "game-info") {
        payload.game_info_channel_id = channelId;
    }

    if (channelType === "event-info") {
        payload.event_info_channel_id = channelId;
    }

    if (channelType === "error-log") {
        payload.error_log_channel_id = channelId;
    }

    if (channelType === "game-code") {
        payload.game_code_channel_id = channelId;
    }

    const { error } = await supabase
        .from("guild_config")
        .upsert(payload, { onConflict: "guild_id" });

    if (error) {
        throw error;
    }
}

async function getConfiguredGuildIds() {
    const { data, error } = await supabase
        .from("guild_config")
        .select("guild_id");

    if (error) {
        throw error;
    }

    return (data || []).map((row) => row.guild_id);
}

async function hasPostedGameNewsLink(guildId, newsLink) {
    const { data, error } = await supabase
        .from("posted_game_news")
        .select("guild_id")
        .eq("guild_id", guildId)
        .eq("news_link", newsLink)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return !!data;
}

async function addPostedGameNewsLink(guildId, newsLink) {
    const { error } = await supabase
        .from("posted_game_news")
        .upsert({
            guild_id: guildId,
            news_link: newsLink
        }, { onConflict: "guild_id,news_link" });

    if (error) {
        throw error;
    }
}

async function hasPostedEventNewsLink(guildId, newsLink) {
    const { data, error } = await supabase
        .from("posted_event_news")
        .select("guild_id")
        .eq("guild_id", guildId)
        .eq("news_link", newsLink)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return !!data;
}

async function addPostedEventNewsLink(guildId, newsLink) {
    const { error } = await supabase
        .from("posted_event_news")
        .upsert({
            guild_id: guildId,
            news_link: newsLink
        }, { onConflict: "guild_id,news_link" });

    if (error) {
        throw error;
    }
}

async function hasPostedGameCode(guildId, code) {
    const { data, error } = await supabase
        .from("posted_game_codes")
        .select("guild_id")
        .eq("guild_id", guildId)
        .eq("code", code)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return !!data;
}

async function addPostedGameCode(guildId, code) {
    const { error } = await supabase
        .from("posted_game_codes")
        .upsert({
            guild_id: guildId,
            code
        }, { onConflict: "guild_id,code" });

    if (error) {
        throw error;
    }
}

async function getUserTranslationLanguage(userId) {
    const { data, error } = await supabase
        .from("user_preferences")
        .select("translation_language")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data?.translation_language || null;
}

async function setUserTranslationLanguage(userId, language) {
    const { error } = await supabase
        .from("user_preferences")
        .upsert({
            user_id: userId,
            translation_language: language,
            updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

    if (error) {
        throw error;
    }
}

module.exports = {
    getGuildConfig,
    setGuildChannel,
    getConfiguredGuildIds,
    hasPostedGameNewsLink,
    addPostedGameNewsLink,
    hasPostedEventNewsLink,
    addPostedEventNewsLink,
    hasPostedGameCode,
    addPostedGameCode,
    getUserTranslationLanguage,
    setUserTranslationLanguage
};