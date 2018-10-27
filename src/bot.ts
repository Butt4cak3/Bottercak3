import { Event, ChatMessageEvent, ConnectEvent, DisconnectEvent, JoinEvent, PartEvent } from "./events";
import { Connector, ChatMessage } from "./connector";
import { Plugin, PluginConstructor } from "./plugin";
import { Dict } from "./collections";
import { User, Permission } from "./user";

export interface Configuration {
  username: string;
  password: string;
  bots: string[];
  ops: string[];
  channels: string[];
  commandPrefix: string;
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

interface PartialCommandDefinition {
  name: string;
  handler: (command: Command) => void;
  permissionLevel?: Permission;
}

export class TwitchBot {
  public readonly name: string;

  private readonly connector: Connector;
  private readonly password: string;
  private readonly bots: string[];
  private readonly ops: string[];
  private readonly channels: string[];
  private readonly plugins: Dict<Plugin>;
  private readonly commands: Dict<CommandDefinition>;
  private commandPrefix: string;

  public readonly onChatMessage: ChatMessageEvent = new Event();
  public readonly onConnect: ConnectEvent = new Event();
  public readonly onDisconnect: DisconnectEvent = new Event();
  public readonly onJoin: JoinEvent = new Event();
  public readonly onPart: PartEvent = new Event();

  public constructor(connector: Connector, config: Partial<Configuration>) {
    this.connector = connector;
    this.name = config.username || "";
    this.password = "";
    this.bots = config.bots ? config.bots.map(name => name.toLowerCase()) : [];
    this.ops = config.ops ? config.ops.map(name => name.toLowerCase()) : [];
    this.channels = config.channels || [];
    this.plugins = Object.create(null);
    this.commands = Object.create(null);
    this.commandPrefix = config.commandPrefix || "!";

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

  public registerCommand(definition: PartialCommandDefinition) {
    const command = {
      name: definition.name,
      handler: definition.handler,
      permissionLevel: definition.permissionLevel || Permission.MODERATOR
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

  public get config(): Configuration {
    return {
      username: this.name,
      password: this.password,
      bots: [...this.bots],
      ops: [...this.ops],
      channels: [...this.channels],
      commandPrefix: this.commandPrefix
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
    return this.ops.indexOf(username) !== -1;
  }

  public isBot(username: string) {
    return this.bots.indexOf(username) !== -1;
  }

  public addBot(username: string) {
    this.bots.push(username.toLowerCase());
  }
}
