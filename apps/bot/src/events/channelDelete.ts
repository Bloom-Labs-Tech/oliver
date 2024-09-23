import { isGuildBasedChannel } from '@sapphire/discord.js-utilities';
import type { Channel } from 'discord.js';
import { OliverEvent } from '../client';

export default class Event extends OliverEvent<'channelDelete'> {
  public constructor() {
    super('channelDelete');
  }

  public async execute(channel: Channel) {
    if (!isGuildBasedChannel(channel)) return;

    const guildId = channel.guild.id;
    if (!this.client.cached[guildId]) return;

    const cachedChannels = this.client.cached[guildId].channels;
    const index = cachedChannels.findIndex((c) => c.id === channel.id);
    if (index === -1) return;

    await this.client.db.channel.delete({ where: { id: channel.id } });
    cachedChannels.splice(index, 1);

    this.client.logger.debug(`Deleted channel ${channel.name}`);
  }
}
