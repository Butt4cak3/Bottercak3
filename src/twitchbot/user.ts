interface Tags {
  "user-id": string;
  nick: string;
  "display-name": string;
  color: string;
  mod: boolean;
  turbo: boolean;
  type: unknown;
  badges: { [key: string]: string };
  subscriber: boolean;
}

export class User {
  public readonly id: string;
  public readonly name: string;
  public readonly displayName: string;
  public readonly color: string;
  public readonly isModerator: boolean;
  public readonly isTurbo: boolean;
  public readonly type: unknown;
  public readonly isSubscriber: boolean;
  public readonly isBroadcaster: boolean;
  public readonly isOp: boolean;
  public readonly isBot: boolean;
  public readonly permissions: unknown;

  public constructor(tags: Tags, isOp: boolean, isBot: boolean) {
    this.id = tags["user-id"];
    this.name = tags.nick;
    this.displayName = tags["display-name"];
    this.color = tags.color;
    this.isModerator = tags.mod;
    this.isTurbo = tags.turbo;
    this.type = tags.type;
    this.isBroadcaster = tags.badges.broadcaster === "1";
    this.isSubscriber = tags.subscriber;
    this.isOp = isOp;
    this.isBot = isBot;
  }
}
