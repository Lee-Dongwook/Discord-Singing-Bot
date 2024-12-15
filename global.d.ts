import { Client, Collection } from "discord.js";

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, Command>;
  }
}

type Command = {
  data: {
    name: string;
    toJSON: () => object;
  };
  execute: (interaction: any) => Promise<void>;
};
