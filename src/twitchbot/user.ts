import { Dict } from "collections";

interface UserState {
  id: string;
  name: string;
  displayName: string;
  color: string;
  badges: Dict<string>;
  isModerator: boolean;
  isTurbo: boolean;
  isSubscriber: boolean;
  isBroadcaster: boolean;
  isOp?: boolean;
  isBot?: boolean;
}

export class User {
  public readonly id: string;
  public readonly name: string;
  public readonly displayName: string;
  public readonly color: string;
  public readonly badges: Dict<string>;
  public readonly isTurbo: boolean;
  public readonly isSubscriber: boolean;
  public readonly isModerator: boolean;
  public readonly isBroadcaster: boolean;
  public readonly isOp: boolean;
  public readonly isBot: boolean;

  public constructor(state: UserState) {
    this.id = state.id;
    this.name = state.name;
    this.displayName = state.displayName;
    this.color = state.color;
    this.badges = { ...state.badges };
    this.isTurbo = state.isTurbo;
    this.isSubscriber = state.isSubscriber;
    this.isModerator = state.isModerator;
    this.isBroadcaster = state.isBroadcaster;
    this.isOp = state.isOp || false;
    this.isBot = state.isBot || false;
  }
}
