import { Event } from "./event";
import { User } from "./user";
import tmi from "tmi.js";

export interface ChatMessage {
  channel: string;
  text: string;
  sender: User;
}

export interface Connector {
  connect(): void;
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

      const state = {
        id: userstate["user-id"],
        name: userstate.username,
        displayName: userstate["display-name"],
        color: userstate.color,
        badges: userstate.badges || {},
        isTurbo: userstate.badges != null && userstate.badges.turbo === "1",
        isSubscriber: userstate.badges != null && userstate.badges.subscriber === "1",
        isModerator: userstate.mod,
        isBroadcaster: userstate.badges != null && userstate.badges.broadcaster === "1"
      };

      this.onChatMessage.invoke({
        channel: channel.substr(1),
        text: message,
        sender: new User(state)
      });
    });
  }

  public connect() {
    this.client.connect();
  }
}
