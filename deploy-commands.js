require("dotenv").config();

const { REST, Routes } = require("discord.js");
const setChannelCommand = require("./commands/set-channel");
const postLatestNewsCommand = require("./commands/post-latest-news");
const postLatestEventsCommand = require("./commands/post-latest-events");
const postLatestCodesCommand = require("./commands/post-latest-codes");

const commands = [
    setChannelCommand.data.toJSON(),
    postLatestNewsCommand.data.toJSON(),
    postLatestEventsCommand.data.toJSON(),
    postLatestCodesCommand.data.toJSON()
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

async function deployCommands() {
    try {
        console.log("Started refreshing application commands...");

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log("Successfully reloaded application commands.");
    } catch (error) {
        console.error("Error while deploying commands:", error);
    }
}

deployCommands();