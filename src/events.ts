import { ChatMessage } from "./connector";

type Handler<T, R> = (data: T) => R;

interface Listener<T, R> {
  handler: Handler<T, R>;
  thisArg: any;
}

export class Event<T, R = void> {
  private listeners = new Map<Handler<T, R>, Listener<T, R>>();

  public subscribe(handler: Handler<T, R>, thisArg?: any) {
    this.listeners.set(handler, { handler, thisArg });
  }

  public unsubscribe(handler: Handler<T, R>) {
    this.listeners.delete(handler);
  }

  public invoke(data: T) {
    const exceptions = new Map<Handler<T, R>, Error>();
    const results = new Map<Handler<T, R>, R>();

    for (const listener of this.listeners.values()) {
      const { handler, thisArg } = listener;

      try {
        results.set(handler, handler.call(thisArg, data));
      } catch (e) {
        if (e instanceof Error) {
          exceptions.set(handler, e);
        }
      }
    }

    return {
      results,
      exceptions
    };
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
