interface Tags {
  "user-id": string;
  nick: string;
  "display-name": string;
  color: string;
  mod: boolean;
  badges: { [key: string]: string } | null;
}

export class User {
  public readonly id: string;
  public readonly name: string;
  public readonly displayName: string;
  public readonly color: string;
  public readonly isModerator: boolean;
  public readonly isTurbo: boolean;
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
    this.isTurbo = tags.badges != null && tags.badges.turbo === "1";
    this.isBroadcaster = tags.badges != null && tags.badges.broadcaster === "1";
    this.isSubscriber = tags.badges != null && tags.badges.subscriber === "1";
    this.isOp = isOp;
    this.isBot = isBot;
  }
}
