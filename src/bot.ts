import { Event, ChatMessageEvent, ConnectEvent, DisconnectEvent, JoinEvent, PartEvent } from "./events";
import { Connector, ChatMessage } from "./connector";
import fs from "fs";
import path from "path";
import { Plugin, PluginConstructor } from "./plugin";
import { Dict } from "./collections";
import { User } from "./user";

export interface Configuration {
  username: string;
  password: string;
  bots: string[];
  ops: string[];
  channels: string[];
}

export class TwitchBot {
  public readonly name: string;

  private readonly connector: Connector;
  private readonly password: string;
  private readonly bots: string[];
  private readonly ops: string[];
  private readonly channels: string[];
  private readonly plugins: Dict<Plugin>;
  private pluginDir?: string;

  public readonly onChatMessage: ChatMessageEvent = new Event();
  public readonly onConnect: ConnectEvent = new Event();
  public readonly onDisconnect: DisconnectEvent = new Event();
  public readonly onJoin: JoinEvent = new Event();
  public readonly onPart: PartEvent = new Event();

  public constructor(connector: Connector, config: Partial<Configuration>) {
    this.connector = connector;
    this.name = config.username || "";
    this.password = config.password || "";
    this.bots = config.bots || [];
    this.ops = config.ops || [];
    this.channels = config.channels || [];
    this.plugins = Object.create(null);

    this.connector.onChatMessage.subscribe(message => this.chatMessageHandler(message));
    this.onConnect.connect(this.connector.onConnect);
    this.connector.onDisconnect.subscribe(this.disconnectHandler, this);
    this.onJoin.connect(this.connector.onJoin);
    this.onPart.connect(this.connector.onPart);
  }

  public async main() {
    await this.loadPlugins();
    await this.connector.connect();
  }

  public setPluginDir(pluginDir: string) {
    this.pluginDir = pluginDir;
  }

  private loadPlugins() {
    const rootDir = this.pluginDir;
    if (!rootDir) return Promise.resolve();

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

  public say(channel: string, message: string) {
    this.connector.say(channel, message);
  }

  public join(channel: string) {
    this.connector.join(channel);
  }

  public part(channel: string) {
    this.connector.part(channel);
  }

  public disconnect() {
    this.connector.disconnect();
  }

  public whisper(user: User | string, message: string) {
    const username = user instanceof User ? user.name : user;

    this.connector.whisper(username, message);
  }

  public get config(): Configuration {
    return {
      username: this.name,
      password: this.password,
      bots: [...this.bots],
      ops: [...this.ops],
      channels: [...this.channels]
    };
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

  private disconnectHandler() {
    this.onDisconnect.invoke({});

    for (const pluginName in this.plugins) {
      const plugin = this.plugins[pluginName];
      plugin.deinit();
    }
  }

  private moduleContainsPlugin(module: any): module is { default: PluginConstructor } {
    return "default" in module &&
      typeof module.default === "function" &&
      module.default.prototype instanceof Plugin;
  }
}
