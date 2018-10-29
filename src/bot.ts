import { Dict } from "./collections";
import { ChatMessage, Connector } from "./connector";
import { ChatMessageEvent, ConnectEvent, DisconnectEvent, Event, JoinEvent, PartEvent } from "./events";
import { Plugin, PluginConstructor } from "./plugin";
import { Permission, User } from "./user";
import { PartialProps } from "./util";
import TwitchClient from "twitch";

export interface Configuration {
  username: string;
  bots: string[];
  ops: string[];
  channels: string[];
  commandPrefix: string;
  checkLiveStatusInterval: number;
  plugins: Dict<any>;
}

export interface Command {
  definition: CommandDefinition;
  params: string[];
  sender: User;
  channel: string;
}

interface CommandDefinition {
  name: string;
  handler: (command: Command) => void;
  permissionLevel: Permission;
}

export type PartialCommandDefinition = PartialProps<CommandDefinition, "permissionLevel">;

export const defaultConfig: Configuration = {
  bots: [],
  channels: [],
  commandPrefix: "!",
  ops: [],
  plugins: {},
  username: "",
  checkLiveStatusInterval: 10
};

export class TwitchBot {
  public readonly api: TwitchClient;

  private readonly connector: Connector;
  private readonly plugins: Dict<Plugin>;
  private readonly commands: Dict<CommandDefinition>;
  private bots: Set<string>;
  private channels: Set<string>;
  private ops: Set<string>;
  private readonly liveStatus: Dict<boolean>;

  private config: Configuration;

  public readonly onChatMessage: ChatMessageEvent = new Event();
  public readonly onConnect: ConnectEvent = new Event();
  public readonly onDisconnect: DisconnectEvent = new Event();
  public readonly onJoin: JoinEvent = new Event();
  public readonly onPart: PartEvent = new Event();
  public readonly onStreamStart: Event<string> = new Event();
  public readonly onStreamEnd: Event<string> = new Event();

  public get commandPrefix() {
    return this.config.commandPrefix;
  }

  public get name() {
    return this.config.username;
  }

  public constructor(connector: Connector, config: Partial<Configuration>) {
    this.connector = connector;
    this.config = {
      ...defaultConfig,
      ...config
    };

    this.bots = new Set(this.config.bots.map(name => name.toLowerCase()));
    this.ops = new Set(this.config.ops.map(name => name.toLowerCase()));
    this.channels = new Set(this.config.channels.map(channel => channel.toLowerCase()));
    this.liveStatus = Object.create(null);

    for (const channel of this.channels) {
      this.liveStatus[channel] = false;
    }

    this.api = TwitchClient.withCredentials(process.env.TWITCH_CLIENT_ID || "");

    this.plugins = Object.create(null);
    this.commands = Object.create(null);

    this.connector.onChatMessage.subscribe(message => this.chatMessageHandler(message));
    this.onConnect.connect(this.connector.onConnect);
    this.connector.onDisconnect.subscribe(this.disconnectHandler, this);
    this.onJoin.connect(this.connector.onJoin);
    this.onPart.connect(this.connector.onPart);
  }

  public async main() {
    await this.connector.connect();

    this.checkLiveStatus();
    setInterval(() => this.checkLiveStatus(), this.config.checkLiveStatusInterval * 60000);
  }

  public async getLiveStatus(channel: string) {
    const user = await this.api.users.getUserByName(channel);
    return user != null && await user.getStream() != null;
  }

  private async checkLiveStatus() {
    for (const channel of this.channels) {
      const isLive = await this.getLiveStatus(channel);

      if (!(channel in this.liveStatus)) {
        this.liveStatus[channel] = isLive;
      }

      if (this.liveStatus[channel] !== isLive) {
        if (isLive) {
          this.onStreamStart.invoke(channel);
        } else {
          this.onStreamEnd.invoke(channel);
        }

        this.liveStatus[channel] = isLive;
      }
    }
  }

  public loadPlugin(constructor: PluginConstructor) {
    const pluginName = constructor.name;
    const plugin = new constructor(this);

    this.plugins[pluginName] = plugin;
    const config = {
      ...plugin.getDefaultConfiguration(),
      ...this.config.plugins[pluginName]
    };
    plugin.mergeConfiguration(config);
    plugin.init();
  }

  public registerCommand(definition: PartialCommandDefinition) {
    const command = {
      name: definition.name,
      handler: definition.handler,
      permissionLevel: definition.permissionLevel != null ? definition.permissionLevel : Permission.MODERATOR
    };

    this.commands[command.name] = command;
  }

  public executeCommand(command: Command) {
    try {
      command.definition.handler(command);
    } catch (e) {
      this.say(command.channel, "I tried to execute that command but something went horribly wrong.");

      if (e instanceof Error) {
        console.error(e.stack);
      }
    }
  }

  public parseCommand(message: ChatMessage): Command | null {
    if (!message.text.startsWith(this.commandPrefix)) {
      return null;
    }

    // This matches a single parameter, whether it it is surrounded by
    // quotation marks or not. The left part matches any non-whitespace string
    // without any quotation marks and the right part matches any series of
    // characters that is surrounded by quotation marks but does not contain
    // any.
    const re = /([^"\s]+|"[^"]+")/g;
    const text = message.text;
    const matches = text.match(re);
    const params = matches != null ? [...matches] : [];
    const name = params.shift()!.slice(1);

    if (!(name in this.commands)) {
      return null;
    }

    const command: Command = {
      definition: this.commands[name],
      channel: message.channel,
      sender: message.sender,
      params: params
    };

    return command;
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

  public getConfiguration(): Configuration {
    const pluginConfigs: Dict<any> = {};

    for (const pluginName in this.plugins) {
      const plugin = this.plugins[pluginName];
      pluginConfigs[pluginName] = plugin.getConfiguration();
    }

    return {
      username: this.name,
      bots: [...this.bots],
      ops: [...this.ops],
      channels: [...this.channels],
      commandPrefix: this.commandPrefix,
      checkLiveStatusInterval: this.config.checkLiveStatusInterval,
      plugins: pluginConfigs
    };
  }

  private chatMessageHandler(message: ChatMessage) {
    if (message.sender.name === this.name) {
      return;
    }

    const userState = {
      ...message.sender,
      isBot: this.isBot(message.sender.name),
      isOp: this.isOP(message.sender.name)
    };

    const sender = new User(userState);

    if (message.text.startsWith(this.commandPrefix)) {
      const command = this.parseCommand(message);

      if (command && sender.hasPermission(command.definition.permissionLevel)) {
        this.executeCommand(command);
      }
    }

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

  public isOP(username: string) {
    return this.ops.has(username);
  }

  public isBot(username: string) {
    return this.bots.has(username);
  }

  public addBot(username: string) {
    this.bots.add(username.toLowerCase());
  }

  public get commandList() {
    const result: string[] = [];

    for (const name in this.commands) {
      result.push(name);
    }

    return result;
  }
}
