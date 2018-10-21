import { TwitchBot } from "./twitchbot/bot";
import { TMIConnector } from "./twitchbot/connector";
import path from "path";
import yaml from "js-yaml";
import fs from "fs";

function loadConfigurationFile(filename: string): Promise<any> {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      const config = yaml.load(data.toString());

      resolve(config);
    });
  });
}

async function main() {
  try {
    const configFileName = path.resolve("config.yml");
    const pluginDir = path.resolve(__dirname, "plugins");

    const config = fs.existsSync(configFileName)
      ? await loadConfigurationFile(configFileName)
      : {};

    const conn = new TMIConnector(config);
    const bot = new TwitchBot(conn, config);

    bot.setPluginDir(pluginDir);

    await bot.main();
  } catch (e) {
    console.error(e);
  }
}

main();
