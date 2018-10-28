import { TwitchBot, PartialCommandDefinition } from "./bot";

export abstract class Plugin {
  protected readonly bot: TwitchBot;

  public constructor(bot: TwitchBot) {
    this.bot = bot;
  }

  protected registerCommand(command: PartialCommandDefinition) {
    this.bot.registerCommand({
      ...command,
      handler: command.handler.bind(this)
    });
  }

  public abstract init(): void;

  public deinit(): void {}
}

export interface PluginConstructor {
  new (bot: TwitchBot): Plugin;
}
