import { TwitchBot } from "./bot";

export abstract class Plugin {
  protected readonly bot: TwitchBot;

  public constructor(bot: TwitchBot) {
    this.bot = bot;
  }

  public abstract init(): void;

  public deinit(): void {}
}

export interface PluginConstructor {
  new(bot: TwitchBot): Plugin;
}
