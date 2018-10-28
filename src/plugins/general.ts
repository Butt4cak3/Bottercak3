import { Plugin, Command } from "../lib";
import { Permission } from "../user";
import { Dict } from "src/collections";
import { ChatMessage } from "src/connector";

export default class General extends Plugin {
  private aliases: Dict<string> = Object.create(null);

  public init() {
    this.bot.registerCommand({
      name: "alias",
      handler: this.alias.bind(this),
      permissionLevel: Permission.MODERATOR
    });

    this.bot.registerCommand({
      name: "join",
      handler: this.join.bind(this),
      permissionLevel: Permission.OP
    });

    this.bot.registerCommand({
      name: "leave",
      handler: this.leave.bind(this),
      permissionLevel: Permission.BROADCASTER
    });

    this.bot.registerCommand({
      name: "quit",
      handler: this.quit.bind(this),
      permissionLevel: Permission.OP
    });

    this.bot.registerCommand({
      name: "say",
      handler: this.say.bind(this),
      permissionLevel: Permission.MODERATOR
    });
  }

  public alias(command: Command) {
    if (command.params.length < 1 || command.params[0].startsWith("@") && command.params.length < 3) {
      return;
    }

    // If only an alias name is provided, remove the alias
    if (command.params.length === 1) {
      const alias = command.params[0];

      if (alias in this.aliases) {
        delete this.aliases[alias];
      }

      return;
    }

    let permissionLevel = Permission.MODERATOR;

    // If the first character of the first parameter is an @, then use that as
    // the permission level
    if (command.params[0].startsWith("@")) {
      const param = command.params.shift()!.substr(1).toUpperCase();
      if (param in Permission) {
        permissionLevel = Permission[param as keyof typeof Permission];
      }
    }

    // Name of the new command
    const alias = command.params[0];

    // The command that the alias should run
    const body = command.params.slice(1).join(" ");

    this.aliases[alias] = body;

    this.bot.registerCommand({
      name: alias,
      handler: this.customCommandHandler.bind(this),
      permissionLevel: permissionLevel
    });
  }

  public customCommandHandler(command: Command) {
    if (!(command.definition.name in this.aliases)) {
      return;
    }

    const body = this.aliases[command.definition.name];

    // Create a fake message and tell the bot to parse it as a command and execute it
    const fakeMessage: ChatMessage = {
      channel: command.channel,
      sender: command.sender,
      text: this.bot.config.commandPrefix + body
    };

    const newCommand = this.bot.parseCommand(fakeMessage);

    if (newCommand != null) {
      this.bot.executeCommand(newCommand);
    }
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

    if (command.sender.isOp || channel === command.channel && command.sender.isBroadcaster) {
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
}
