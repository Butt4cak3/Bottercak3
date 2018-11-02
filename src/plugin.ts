import { PartialCommandDefinition, TwitchBot } from "./bot";

export abstract class Plugin {
  protected readonly bot: TwitchBot;
  protected config: any;

  public constructor(bot: TwitchBot) {
    this.bot = bot;
    this.config = this.getDefaultConfiguration();
  }

  public getDefaultConfiguration() {
    return {};
  }

  public mergeConfiguration(config: any) {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  public getConfiguration() {
    return {
      ...this.config,
    };
  }

  public deinit(): void {}

  public abstract init(): void;

  protected registerCommand(command: PartialCommandDefinition) {
    this.bot.registerCommand({
      ...command,
      handler: command.handler.bind(this),
    });
  }
}

export interface PluginConstructor {
  new (bot: TwitchBot): Plugin;
}
