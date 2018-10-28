import { ChatMessage } from "./connector";

type Handler<T> = (data: T) => void;

interface Listener<T> {
  handler: Handler<T>;
  thisArg: any;
}

export class Event<T> {
  private listeners = new Map<Handler<T>, Listener<T>>();

  public subscribe(handler: Handler<T>, thisArg?: any) {
    this.listeners.set(handler, { handler, thisArg });
  }

  public unsubscribe(handler: Handler<T>) {
    this.listeners.delete(handler);
  }

  public invoke(data: T) {
    for (const listener of this.listeners.values()) {
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
