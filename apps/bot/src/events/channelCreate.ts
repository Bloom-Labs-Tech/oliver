import { isGuildBasedChannel } from '@sapphire/discord.js-utilities';
import type { Channel } from 'discord.js';
import { client } from '..';
import { OliverEvent } from '../client';

export default class Event extends OliverEvent<'channelCreate'> {
  public constructor() {
    super('channelCreate');
  }

  public async execute(channel: Channel) {
    if (!isGuildBasedChannel(channel)) return;

    const guildId = channel.guild.id;
    if (!client.cached[guildId]) return;

    const cachedChannels = client.cached[guildId].channels;
    if (cachedChannels.some((c) => c.id === channel.id)) return;

    const dbChannel = await client.db.channel.create({
      data: {
        id: channel.id,
        guildId,
        type: this.client.formatChannelType(channel.type),
        name: channel.name,
        description: 'topic' in channel ? channel.topic : '',
      },
    });

    client.cached[guildId].channels.push(dbChannel);
    client.logger.debug(`Cached channel ${channel.name}`);
  }
}
