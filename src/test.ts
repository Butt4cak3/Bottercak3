import { TwitchBot } from "./twitchbot/bot";
import { TMIConnector } from "./twitchbot/connection";
import path from "path";

async function main() {
  const conn = new TMIConnector({
    channels: ["buttercak3"]
  });

  const bot = new TwitchBot(conn);

  const rootDir = path.resolve(__dirname, "plugins");
  await bot.loadPlugins(rootDir);
}

main();
