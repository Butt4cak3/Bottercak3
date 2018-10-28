import { TwitchBot, TwitchJSConnector, plugins } from "./lib";

const config = {
  username: process.env.TWITCH_USERNAME,
  password: process.env.TWITCH_OAUTH_TOKEN,
  channels: ["buttercak3"],
  ops: ["buttercak3"]
};

const bot = new TwitchBot(new TwitchJSConnector(config), config);
bot.loadPlugin(plugins.General);
bot.main();
