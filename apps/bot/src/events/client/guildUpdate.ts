import type { Guild } from 'discord.js';
import { OliverEvent } from '~/client';

export default class Event extends OliverEvent<'guildUpdate'> {
  public constructor() {
    super('guildUpdate');
  }

  public async execute(oldGuild: Guild, newGuild: Guild): Promise<void> {
    if (oldGuild.name !== newGuild.name) {
      await this.client.db.guild.update({
        where: {
          id: newGuild.id,
        },
        data: {
          name: newGuild.name,
        },
      });
    }
  }
}
