import { TwitchBot, TwitchJSConnector, plugins, defaultConfig, Configuration } from "./lib";
import fs from "fs";
import yaml from "js-yaml";

const configFileName = "config.yml";

// Create the configuration file if it does not alrady exist
if (!fs.existsSync(configFileName)) {
  fs.writeFileSync(configFileName, "");
}

// Load the contents of the configuration file
const configString = fs.readFileSync(configFileName, { encoding: "utf-8" });

// Merge the loaded configuration with the default configuration
const config: Configuration = {
  ...defaultConfig,
  ...yaml.load(configString)
};

// Write the merged config back into the file
fs.writeFileSync(configFileName, yaml.dump(config));

// Create a new connector that delegates the connection to Twitch to a third-party library
const connector = new TwitchJSConnector({
  username: config.username,
  password: process.env.TWITCH_OAUTH_TOKEN || "",
  channels: [...config.channels]
});

// Start up the bot
const bot = new TwitchBot(connector, config);

// Load the general plugin
bot.loadPlugin(plugins.General);

bot.main();
