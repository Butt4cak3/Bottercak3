export * from "./bot";
export * from "./connector";
export * from "./events";
export { Plugin } from "./plugin";
export { Permission, User } from "./user";

import General from "./plugins/general";

export const plugins = {
  General,
};
