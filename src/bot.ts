import { Event, ChatMessageEvent, ConnectEvent, DisconnectEvent, JoinEvent, PartEvent } from "./events";
import { Connector, ChatMessage } from "./connector";
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

  public readonly onChatMessage: ChatMessageEvent = new Event();
  public readonly onConnect: ConnectEvent = new Event();
  public readonly onDisconnect: DisconnectEvent = new Event();
  public readonly onJoin: JoinEvent = new Event();
  public readonly onPart: PartEvent = new Event();

  public constructor(connector: Connector, config: Partial<Configuration>) {
    this.connector = connector;
    this.name = config.username || "";
    this.password = "";
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
    await this.connector.connect();
  }

  public loadPlugin(constructor: PluginConstructor) {
    const pluginName = constructor.name;
    const plugin = new constructor(this);

    this.plugins[pluginName] = plugin;
    plugin.init();
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
}
