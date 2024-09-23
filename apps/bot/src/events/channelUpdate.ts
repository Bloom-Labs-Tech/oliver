import { isGuildBasedChannel } from '@sapphire/discord.js-utilities';
import type { Channel } from 'discord.js';
import { client } from '..';
import { OliverEvent } from '../client';

export default class Event extends OliverEvent<'channelUpdate'> {
  public constructor() {
    super('channelUpdate');
  }

  public async execute(oldChannel: Channel, newChannel: Channel) {
    if (!isGuildBasedChannel(newChannel)) return;

    const guildId = newChannel.guild.id;
    if (!client.cached[guildId]) return;

    const cachedChannels = client.cached[guildId].channels;
    const index = cachedChannels.findIndex((c) => c.id === oldChannel.id);
    if (index === -1) return;

    const dbChannel = await client.db.channel.update({
      where: { id: oldChannel.id },
      data: {
        name: newChannel.name,
        description: 'topic' in newChannel ? newChannel.topic : '',
      },
    });

    cachedChannels[index] = dbChannel;
    client.logger.debug(`Updated channel ${newChannel.name}`);
  }
}
