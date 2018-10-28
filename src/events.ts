import { ChatMessage } from "./connector";

interface Listener<T> {
  handler: (data: T) => void;
  thisArg: any;
}

export class Event<T> {
  private listeners: Listener<T>[] = [];

  public subscribe(handler: (data: T) => void, thisArg?: any) {
    this.listeners.push({ handler, thisArg });
  }

  public unsubscribe() {
    throw new Error("Not implemented");
  }

  public invoke(data: T) {
    for (const listener of this.listeners) {
      listener.handler.call(listener.thisArg, data);
    }
  }

  public connect(event: Event<T>, convert?: (data: T) => T): void;
  public connect<S>(event: Event<S>, convert: (data: S) => T): void;
  public connect<S>(event: Event<S>, convert?: (data: any) => T): void {
    const converter = convert || (data => data);

    event.subscribe(data => this.invoke(converter(data)));
  }
}

export type ChatMessageEvent = Event<ChatMessage>;
export type ConnectEvent = Event<{}>;
export type DisconnectEvent = Event<{}>;
export type JoinEvent = Event<{ channel: string; username: string }>;
export type PartEvent = Event<{ channel: string; username: string }>;
