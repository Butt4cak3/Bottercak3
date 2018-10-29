import { Dict } from "../collections";
import { ChatMessage, Command, Permission, Plugin } from "../lib";
import TwitchClient from "twitch";

interface Alias {
  permissionLevel: Permission;
  commandString: string;
}

interface Config {
  aliases: Dict<Alias>;
}

export default class General extends Plugin {
  protected config: Config = this.getDefaultConfiguration();

  public getDefaultConfiguration(): Config {
    return {
      aliases: {}
    };
  }

  public init() {
    this.registerCommand({
      name: "alias",
      handler: this.alias,
      permissionLevel: Permission.MODERATOR
    });

    this.registerCommand({
      name: "commands",
      handler: this.help,
      permissionLevel: Permission.EVERYONE
    });

    this.registerCommand({
      name: "help",
      handler: this.help,
      permissionLevel: Permission.EVERYONE
    });

    this.registerCommand({
      name: "join",
      handler: this.join,
      permissionLevel: Permission.OP
    });

    this.registerCommand({
      name: "leave",
      handler: this.leave,
      permissionLevel: Permission.BROADCASTER
    });

    this.registerCommand({
      name: "quit",
      handler: this.quit,
      permissionLevel: Permission.OP
    });

    this.registerCommand({
      name: "say",
      handler: this.say,
      permissionLevel: Permission.MODERATOR
    });

    this.registerCommand({
      name: "uptime",
      handler: this.uptime,
      permissionLevel: Permission.EVERYONE
    });

    for (const name in this.config.aliases) {
      const alias = this.config.aliases[name];
      this.createAlias(name, alias.permissionLevel, alias.commandString);
    }
  }

  public alias(command: Command) {
    if (command.params.length < 1 || (command.params[0].startsWith("@") && command.params.length < 3)) {
      return;
    }

    // If only an alias name is provided, remove the alias
    if (command.params.length === 1) {
      const alias = command.params[0];

      if (alias in this.config.aliases) {
        delete this.config.aliases[alias];
      }

      return;
    }

    let permissionLevel = Permission.MODERATOR;

    // If the first character of the first parameter is an @, then use that as
    // the permission level
    if (command.params[0].startsWith("@")) {
      const param = command.params
        .shift()!
        .substr(1)
        .toUpperCase();

      if (param in Permission) {
        permissionLevel = Permission[param as keyof typeof Permission];
      }
    }

    // Name of the new command
    const alias = command.params[0];

    // The command that the alias should run
    const commandString = command.params.slice(1).join(" ");

    this.createAlias(alias, permissionLevel, commandString);
  }

  private createAlias(name: string, permissionLevel: Permission, commandString: string) {
    this.config.aliases[name] = {
      permissionLevel,
      commandString
    };

    this.registerCommand({
      name: name,
      handler: this.customCommandHandler,
      permissionLevel: permissionLevel
    });
  }

  public customCommandHandler(command: Command) {
    if (!(command.definition.name in this.config.aliases)) {
      return;
    }

    const alias = this.config.aliases[command.definition.name];

    // Create a fake message and tell the bot to parse it as a command and execute it
    const fakeMessage: ChatMessage = {
      channel: command.channel,
      sender: command.sender,
      text: this.bot.commandPrefix + alias.commandString
    };

    const newCommand = this.bot.parseCommand(fakeMessage);

    if (newCommand != null) {
      this.bot.executeCommand(newCommand);
    }
  }

  public help(command: Command) {
    let commands = this.bot.commandList.map(name => this.bot.commandPrefix + name).join(" ");

    this.bot.say(command.channel, `Available commands: ${commands}`);
  }

  public join(command: Command) {
    if (command.params.length < 1) {
      this.bot.say(command.channel, `@${command.sender.displayName} You have to provide a channel name.`);
      return;
    }

    this.bot.join(command.params[0]);
  }

  public leave(command: Command) {
    const channel = command.params[0] || command.channel;

    if (command.sender.isOp || (channel === command.channel && command.sender.isBroadcaster)) {
      this.bot.part(channel);
    } else {
      this.bot.say(command.channel, `@${command.sender.displayName} You can't make me leave other people's channels.`);
    }
  }

  public quit(_command: Command) {
    this.bot.disconnect();
  }

  public say(command: Command) {
    this.bot.say(command.channel, command.params.join(" "));
  }

  public async uptime(command: Command) {
    const clientId = process.env.TWITCH_CLIENT_ID;
    if (clientId == null) return;

    const client = TwitchClient.withCredentials(clientId);

    const user = await client.users.getUserByName(command.channel);
    if (user == null) return;

    const stream = await client.streams.getStreamByChannel(user.id);
    if (stream == null) return;

    const now = new Date().getTime();
    const uptime = (now - stream.startDate.getTime()) / 1000;

    let remaining = uptime;

    const hours = Math.floor(remaining / 3600);
    remaining -= hours * 3600;

    const minutes = Math.floor(remaining / 60);
    remaining -= minutes * 60;

    const minutesFormatted = `0${minutes}`.substr(-2);

    this.bot.say(command.channel, `Uptime: ${hours}h ${minutesFormatted}m`);
  }
}
