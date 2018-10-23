import { Event, ChatMessageEvent, ConnectEvent, DisconnectEvent, JoinEvent, PartEvent } from "./events";
import { User } from "./user";
import tmi from "tmi.js";
import { Configuration } from "./bot";

export interface ChatMessage {
  channel: string;
  text: string;
  sender: User;
}

export interface Connector {
  readonly onChatMessage: ChatMessageEvent;
  readonly onConnect: ConnectEvent;
  readonly onDisconnect: DisconnectEvent;
  readonly onJoin: JoinEvent;
  readonly onPart: PartEvent;

  connect(): Promise<any>;
  disconnect(): void;
  join(channel: string): void;
  part(channel: string): void;
  say(channel: string, message: string): void;
  whisper(username: string, message: string): void;
}

export class TMIConnector {
  private readonly client: tmi.Client;

  public readonly onChatMessage: ChatMessageEvent = new Event();
  public readonly onConnect: ConnectEvent = new Event();
  public readonly onDisconnect: DisconnectEvent = new Event();
  public readonly onJoin: JoinEvent = new Event();
  public readonly onPart: PartEvent = new Event();

  public constructor(config: Partial<Configuration>) {
    const { username, password } = config;

    if (!username || !password) {
      throw new Error();
    }

    this.client = tmi.client({
      identity: {
        username,
        password
      },

      channels: config.channels || []
    });

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

    this.client.on("connected", () => {
      this.onConnect.invoke({});
    });

    this.client.on("disconnected", () => {
      this.onDisconnect.invoke({});
    });

    this.client.on("join", (channel, username) => {
      this.onJoin.invoke({ channel, username });
    });

    this.client.on("part", (channel, username) => {
      this.onPart.invoke({ channel, username });
    });
  }

  public async connect() {
    this.client.connect();
  }

  public say(channel: string, message: string): void {
    this.client.say(channel, message);
  }

  public join(channel: string): void {
    this.client.join(channel);
  }

  public part(channel: string): void {
    this.client.part(channel);
  }

  public disconnect(): void {
    this.client.disconnect();
  }

  public whisper(username: string, message: string): void {
    this.client.whisper(username, message);
  }
}
