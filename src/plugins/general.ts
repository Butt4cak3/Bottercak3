import { Plugin, Command } from "../lib";

export default class General extends Plugin {
  public init() {
    this.bot.registerCommand({
      name: "say",
      handler: this.say.bind(this)
    });
  }

  public say(command: Command) {
    this.bot.say(command.channel, command.params.join(" "));
  }
}
