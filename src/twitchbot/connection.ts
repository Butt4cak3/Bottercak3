import { Event } from "./event";
import { User } from "./user";
import tmi from "tmi.js";

export interface ChatMessage {
  channel: string;
  text: string;
  sender: User;
}

export interface Connector {
  readonly onChatMessage: Event<ChatMessage>;
}

export interface Options {
  channels: string[];
}

export class TMIConnector {
  private readonly client: tmi.Client;

  public readonly onChatMessage = new Event<ChatMessage>();

  public constructor(options: Options) {
    const clientOptions = {
      channels: options.channels.slice(0)
    };

    this.client = tmi.client(clientOptions);
    this.client.on("chat", (channel, userstate, message, self) => {
      if (self) return;

      const tags = {
        "user-id": userstate["user-id"],
        nick: userstate.username,
        "display-name": userstate["display-name"],
        color: userstate.color,
        mod: userstate.mod,
        turbo: userstate.turbo,
        type: userstate["user-type"],
        badges: userstate.badges,
        subscriber: userstate.subscriber
      };

      this.onChatMessage.invoke({
        channel: channel.substr(1),
        text: message,
        sender: new User(tags, false, false)
      });
    });
  }
}
