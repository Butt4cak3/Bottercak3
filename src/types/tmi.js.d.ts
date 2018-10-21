declare module "tmi.js" {
  type ReadyState = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED";

  interface ClientOptions {
    options?: {
      clientId?: string
      debug?: boolean
    };

    connection?: {
      server?: string;
      port?: number;
      reconnect?: boolean;
      maxReconnectAttempts?: number;
      maxReconnectInterval?: number;
      reconnectDecay?: number;
      reconnectInterval?: number;
      secure?: boolean;
      timeout?: number;
    };

    identity?: {
      username: string;
      password: string;
    };

    channels?: string[];

    logger?: any;
  }

  interface UserState {
    badges: {
      [key: string]: string
    };
    color: string;
    "display-name": string;
    emotes: { [key: string]: string[] };
    mod: boolean;
    "room-id": string;
    subscriber: boolean;
    turbo: boolean;
    "user-id": string;
    "user-type": string;
    "emotes-raw": string;
    "badges-raw": string;
    username: string;
    "message-type": string;
  }

  function client(options: ClientOptions): Client;

  class Client {
    public getChannels(): string[];
    public getOptions(): ClientOptions;
    public getUsername(): string;
    public isMod(channel: string, username: string): boolean;
    public readyState(): ReadyState;
    public on(event: "chat", callback: (channel: string, userstate: UserState, message: string, self: boolean) => void): void;
  }
}
