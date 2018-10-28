import { Dict } from "./collections";

declare module "twitch-js" {
  type ReadyState = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED";

  interface Badges {
    [key: string]: string;
  }

  interface ClientOptions {
    options?: {
      clientId?: string;
      debug?: boolean;
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
    badges: Badges | null;
    color: string;
    "display-name": string;
    emotes: Dict<string[]>;
    mod: boolean;
    "room-id": string;
    "user-id": string;
    "emotes-raw": string;
    "badges-raw": string;
    username: string;
    "message-type": string;
  }

  interface CheerUserState extends UserState {
    bits: number;
  }

  function client(options: ClientOptions): Client;

  interface RoomState {}

  interface SubMethods {}

  interface EmoteSets {}

  class Client {
    public getChannels(): string[];
    public getOptions(): ClientOptions;
    public getUsername(): string;
    public isMod(channel: string, username: string): boolean;
    public readyState(): ReadyState;

    public action(channel: string, message: string): Promise<void>;
    public ban(channel: string, username: string, reason: string): Promise<[string, string, string]>;
    public clear(channel: string): Promise<[string]>;
    public color(color: string): Promise<[string]>;
    public commercial(channel: string, seconds: number): Promise<[string, number]>;
    public connect(): Promise<[string, number]>;
    public disconnect(): Promise<[string, number]>;
    public emoteonly(channel: string): Promise<[string]>;
    public emoteonlyoff(channel: string): Promise<[string]>;
    public followersonly(channel: string, length: number): Promise<[string, number]>;
    public followersonlyoff(channel: string): Promise<[string]>;
    public host(channel: string, target: string): Promise<[string, string]>;
    public join(channel: string): Promise<[string]>;
    public mod(channel: string, username: string): Promise<[string, string]>;
    public mods(channel: string): Promise<[string[]]>;
    public part(channel: string): Promise<[string]>;
    public ping(): Promise<[number]>;
    public r9kbeta(channel: string): Promise<[string]>;
    public r9kbetaoff(channel: string): Promise<[string]>;
    public raw(message: string): Promise<[string]>;
    public say(channel: string, message: string): Promise<[string]>;
    public slow(channel: string, length: number): Promise<[string]>;
    public slowoff(channel: string): Promise<[string]>;
    public subscribers(channel: string): Promise<[string]>;
    public subscribersoff(channel: string): Promise<[string]>;
    public timeout(
      channel: string,
      username: string,
      length: number,
      reason: string
    ): Promise<[string, string, number, string]>;
    public unban(channel: string, username: string): Promise<[string, string]>;
    public unhost(channel: string): Promise<[string]>;
    public unmod(channel: string, username: string): Promise<[string, string]>;
    public whisper(username: string, message: string): Promise<[string, string]>;

    public on(
      event: "action",
      callback: (channel: string, userstate: UserState, message: string, self: boolean) => void
    ): void;
    public on(event: "ban", callback: (channel: string, username: string, reason: string) => void): void;
    public on(
      event: "chat",
      callback: (channel: string, userstate: UserState, message: string, self: boolean) => void
    ): void;
    public on(event: "cheer", callback: (channel: string, userstate: CheerUserState, message: string) => void): void;
    public on(event: "clearchat", callback: (channel: string) => void): void;
    public on(event: "connected", callback: (address: string, port: number) => void): void;
    public on(event: "connecting", callback: (adress: string, port: number) => void): void;
    public on(event: "disconnected", callback: (reason: string) => void): void;
    public on(event: "emoteonly", callback: (channel: string, enabled: boolean) => void): void;
    public on(event: "emotesets", callback: (sets: string, obj: EmoteSets) => void): void;
    public on(event: "followersonly", callback: (channel: string, enabled: boolean, length: number) => void): void;
    public on(
      event: "hosted",
      callback: (channel: string, username: string, viewers: number, autohost: boolean) => void
    ): void;
    public on(event: "hosting", callback: (channel: string, target: string, viewers: number) => void): void;
    public on(event: "join", callback: (channel: string, username: string, self: boolean) => void): void;
    public on(event: "logon", callback: () => void): void;
    public on(
      event: "message",
      callback: (channel: string, userstate: UserState, message: string, self: boolean) => void
    ): void;
    public on(event: "mod", callback: (channel: string, username: string) => void): void;
    public on(event: "mods", callback: (channel: string, mods: string[]) => void): void;
    public on(event: "notice", callback: (channel: string, msgid: string, message: string) => void): void;
    public on(event: "part", callback: (channel: string, username: string, self: boolean) => void): void;
    public on(event: "ping", callback: () => void): void;
    public on(event: "pong", callback: (latency: number) => void): void;
    public on(event: "r9kbeta", callback: (channel: string, enabled: boolean) => void): void;
    public on(event: "reconnect", callback: () => void): void;
    public on(
      event: "resub",
      callback: (
        channel: string,
        username: string,
        months: number,
        message: string,
        userstate: UserState,
        methods: SubMethods
      ) => void
    ): void;
    public on(event: "roomstate", callback: (channel: string, state: RoomState) => void): void;
    public on(event: "serverchange", callback: (channel: string) => void): void;
    public on(event: "slowmode", callback: (channel: string, enabled: boolean, length: number) => void): void;
    public on(event: "subscribers", callback: (channel: string, enabled: boolean) => void): void;
    public on(
      event: "subscription",
      callback: (channel: string, username: string, method: SubMethods, message: string, userstate: UserState) => void
    ): void;
    public on(
      event: "timeout",
      callback: (channel: string, username: string, reason: string, duration: number) => void
    ): void;
    public on(event: "unhost", callback: (channel: string, viewers: number) => void): void;
    public on(event: "unmod", callback: (channel: string, username: string) => void): void;
    public on(
      event: "whisper",
      callback: (from: string, userstate: UserState, message: string, self: boolean) => void
    ): void;
  }
}
