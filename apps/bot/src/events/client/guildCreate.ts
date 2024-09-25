import type { Guild } from 'discord.js';
import { client } from '../..';
import { OliverEvent } from '../../client';

export default class Event extends OliverEvent<'guildCreate'> {
  public constructor() {
    super('guildCreate');
  }

  public async execute(guild: Guild) {
    const guildId = guild.id;

    if (!client.cached[guildId]) {
      client.cached[guildId] = {
        channels: [],
        roles: [],
      };
    }

    await this.client.db.guild.upsert({
      where: {
        id: guild.id,
      },
      update: {
        name: guild.name,
      },
      create: {
        id: guild.id,
        name: guild.name,
      },
    });

    const channels = (await guild.channels.fetch()).filter((channel) => !!channel);
    const roles = (await guild.roles.fetch()).filter((role) => !!role);
    const users = (await guild.members.fetch()).filter((member) => !!member && !member.user.bot);

    await this.client.cacheChannels(channels, guild);
    await this.client.cacheRoles(roles, guild);
    await this.client.cacheUsers(users, guild);

    client.logger.debug(`Cached guild ${guild.name}`);
  }
}
