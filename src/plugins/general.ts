import { Plugin, Command } from "../lib";
import { Permission } from "../user";

export default class General extends Plugin {
  public init() {
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
