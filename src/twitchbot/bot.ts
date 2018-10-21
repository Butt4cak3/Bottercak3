import { Event } from "./event";
import { Connector, ChatMessage } from "./connector";
import fs from "fs";
import path from "path";
import { Plugin, PluginConstructor } from "./plugin";
import { Dict } from "collections";
import { User } from "./user";

export class TwitchBot {
  private readonly connection: Connector;
  private readonly bots: string[] = [];
  private readonly ops: string[] = [];
  private readonly name: string = "";
  private readonly plugins: Dict<Plugin> = Object.create(null);

  public readonly onChatMessage = new Event<ChatMessage>();

  public constructor(connection: Connector) {
    this.connection = connection;

    this.connection.onChatMessage.subscribe((message) => {
      this.chatMessageHandler(message);
    });
  }

  public main() {
    this.connection.connect();
  }

  public async loadPlugins(rootDir: string) {
    return new Promise((resolve, reject) => {
      const imports: Promise<{ name: string, module: unknown }>[] = [];

      fs.readdir(rootDir, (err, items) => {
        if (err) {
          reject(err);
          return;
        }

        if (!items) {
          resolve();
          return;
        }

        for (const pluginName of items) {
          const pluginDir = path.join(rootDir, pluginName);
          const stat = fs.lstatSync(pluginDir);

          if (!stat.isDirectory) continue;

          imports.push(import(path.join(pluginDir, "main")).then((module) => {
            return {
              name: pluginName,
              module: module
            };
          }));
        }

        Promise.all(imports).then((results) => {
          for (const result of results) {
            const pluginName = result.name;
            const module = result.module;

            if (!this.moduleContainsPlugin(module)) {
              console.error(`${pluginName} is not a valid plugin.`);
              continue;
            }

            const plugin = new module.default(this);
            this.plugins[pluginName] = plugin;
          }

          resolve();
        });
      });
    });
  }

  private chatMessageHandler(message: ChatMessage) {
    if (message.sender.name === this.name) {
      return;
    }

    const sender = new User({
      ...message.sender,
      isBot: this.bots.indexOf(message.sender.name) !== -1,
      isOp: this.ops.indexOf(message.sender.name) !== -1
    });

    this.onChatMessage.invoke({
      sender,
      text: message.text,
      channel: message.channel
    });
  }

  private moduleContainsPlugin(module: any): module is { default: PluginConstructor } {
    return "default" in module &&
      typeof module.default === "function" &&
      module.default.prototype instanceof Plugin;
  }
}
