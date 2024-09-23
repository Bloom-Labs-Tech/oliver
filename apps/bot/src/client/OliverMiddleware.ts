import { CommandInteraction } from 'discord.js';
import { client } from '..';

export class OliverMiddleware {
  public readonly client = client;

  public async run(_: CommandInteraction): Promise<boolean> {
    return true;
  }
}
