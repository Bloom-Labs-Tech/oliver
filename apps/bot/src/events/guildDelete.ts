import type { Guild } from 'discord.js';
import { client } from '..';
import { OliverEvent } from '../client';

export default class Event extends OliverEvent<'guildDelete'> {
  public constructor() {
    super('guildDelete');
  }

  public async execute(guild: Guild) {
    const guildId = guild.id;

    await this.client.db.guild.delete({
      where: {
        id: guild.id,
      },
    });

    if (client.cached[guildId]) {
      delete client.cached[guildId];
    }

    client.logger.debug(`Deleted guild ${guild.name}`);
  }
}
