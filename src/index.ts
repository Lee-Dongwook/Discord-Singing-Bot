import { Client, Collection, GatewayIntentBits, Routes } from "discord.js";
import { REST } from "@discordjs/rest";
import { AudioPlayer } from "@discordjs/voice";
import fs from "fs";
import path from "path";
import "dotenv/config";

type Command = {
  data: {
    name: string;
    toJSON: () => object;
  };
  execute: (interaction: any) => Promise<void>;
};

type QueueItem = {
  playlist: { url: string }[];
  player: AudioPlayer;
};

export const queue: Map<string, QueueItem> = new Map();
export const log: Record<string, { author: string; content: string }[]> = {};

const token = process.env.DISCORD_TOKEN as string;
const clientId = process.env.CLIENT_ID as string;
const guildId = process.env.GUILD_ID as string;

if (!token || !clientId || !guildId) {
  throw new Error("환경변수가 설정되지 않았습니다.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const rest = new REST({ version: "10" }).setToken(token);

client.commands = new Collection<string, Command>();

const loadCommands = async () => {
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = (await fs.readdirSync(commandsPath)).filter(
    (file) => file.endsWith(".js") || file.endsWith(".ts")
  );

  const commands = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command: Command = require(filePath);

    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commands,
  });
  console.log("Successfully registered application commands");
};

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (!log[message.channelId]) {
    log[message.channelId] = [];
  }
  log[message.channelId].push({
    author: message.author.username,
    content: message.content,
  });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "An error occurred while executing the command!",
      ephemeral: true,
    });
  }
});

(async () => {
  try {
    await loadCommands();
    await client.login(token);
    console.log("Bot is online!");
  } catch (error) {
    console.error("Failed to start the bot:", error);
  }
})();
