require("dotenv").config();

const express = require("express");
const { Client, GatewayIntentBits, Events } = require("discord.js");
const { getConfiguredGuildIds } = require("./services/config-services");
const { postNewGameNewsForGuild } = require("./services/game-news-poster");
const { postNewEventNewsForGuild } = require("./services/event-news-poster");
const { postNewGameCodesForGuild } = require("./services/game-code-poster");
const { sendErrorLog } = require("./services/error-logger");

const setChannelCommand = require("./commands/set-channel");
const postLatestNewsCommand = require("./commands/post-latest-news");
const postLatestEventsCommand = require("./commands/post-latest-events");
const postLatestCodesCommand = require("./commands/post-latest-codes");
const translateMessageCommand = require("./commands/translate-message");
const setTranslationLanguageCommand = require("./commands/set-translation-language");

const application = express();
const port = process.env.PORT || 3000;

application.get("/", (request, response) => {
    response.send("Bot is running.");
});

application.listen(port, () => {
    console.log(`Health server listening on port ${port}`);
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const commands = new Map();
commands.set(setChannelCommand.data.name, setChannelCommand);
commands.set(postLatestNewsCommand.data.name, postLatestNewsCommand);
commands.set(postLatestEventsCommand.data.name, postLatestEventsCommand);
commands.set(postLatestCodesCommand.data.name, postLatestCodesCommand);
commands.set(translateMessageCommand.data.name, translateMessageCommand);
commands.set(setTranslationLanguageCommand.data.name, setTranslationLanguageCommand);

async function checkAllGuildContent() {
    const guildIds = await getConfiguredGuildIds();

    if (guildIds.length === 0) {
        console.log("No guilds configured for automatic content check.");
        return;
    }

    for (const guildId of guildIds) {
        try {
            const gameNewsResult = await postNewGameNewsForGuild(client, guildId);

            if (gameNewsResult.postedCount > 0) {
                console.log(`Posted ${gameNewsResult.postedCount} new game news item(s) for guild ${guildId}.`);
            } else {
                console.log(`No game news posted for guild ${guildId}: ${gameNewsResult.reason}`);
            }

            const eventNewsResult = await postNewEventNewsForGuild(client, guildId);

            if (eventNewsResult.postedCount > 0) {
                console.log(`Posted ${eventNewsResult.postedCount} new event news item(s) for guild ${guildId}.`);
            } else {
                console.log(`No event news posted for guild ${guildId}: ${eventNewsResult.reason}`);
            }

            const gameCodesResult = await postNewGameCodesForGuild(client, guildId);

            if (gameCodesResult.postedCount > 0) {
                console.log(`Posted ${gameCodesResult.postedCount} new game code(s) for guild ${guildId}.`);
            } else {
                console.log(`No game codes posted for guild ${guildId}: ${gameCodesResult.reason}`);
            }
        } catch (error) {
            console.error(`Error while checking content for guild ${guildId}:`, error);

            await sendErrorLog(
                client,
                guildId,
                "Automatic content check",
                error
            );
        }
    }
}

client.once(Events.ClientReady, () => {
    const configuredIntervalMinutes = Number(process.env.CONTENT_CHECK_INTERVAL_MINUTES || 15);
    const contentCheckIntervalInMilliseconds = configuredIntervalMinutes * 60 * 1000;

    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Content check interval: ${configuredIntervalMinutes} minute(s).`);

    checkAllGuildContent().catch((error) => {
        console.error("Initial automatic content check failed:", error);
    });

    setInterval(() => {
        checkAllGuildContent().catch((error) => {
            console.error("Scheduled automatic content check failed:", error);
        });
    }, contentCheckIntervalInMilliseconds);
});

client.on(Events.InteractionCreate, async (interaction) => {
    const isSupportedInteraction =
        interaction.isChatInputCommand()
        || interaction.isMessageContextMenuCommand();

    if (!isSupportedInteraction) {
        return;
    }

    const command = commands.get(interaction.commandName);

    if (!command) {
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error("Error while executing command:", error);

        await sendErrorLog(
            interaction.client,
            interaction.guildId,
            `Command /${interaction.commandName}`,
            error
        );

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "❌ An error occurred while executing this command.",
                flags: 64
            });
            return;
        }

        await interaction.reply({
            content: "❌ An error occurred while executing this command.",
            flags: 64
        });
    }
});

client.login(process.env.DISCORD_TOKEN);