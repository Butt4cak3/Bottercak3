interface Listener<T> {
  handler: (data: T) => void;
}

export class Event<T> {
  private listeners: Listener<T>[] = [];

  public subscribe(handler: (data: T) => void) {
    this.listeners.push({ handler });
  }

  public unsubscribe() {
    throw new Error("Not implemented");
  }

  public invoke(data: T) {
    for (const listener of this.listeners) {
      listener.handler(data);
    }
  }
}
