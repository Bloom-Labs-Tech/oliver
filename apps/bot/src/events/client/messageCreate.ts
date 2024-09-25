import { isGuildBasedChannel } from '@sapphire/discord.js-utilities';
import { Message } from 'discord.js';
import { getGuildFeature } from '~/services/common';
import { handleLevelUp } from '~/services/levels';
import { OliverEvent } from '../../client';

export default class OliverReadyEvent extends OliverEvent<'messageCreate'> {
  public constructor() {
    super('messageCreate', {
      runOnce: false,
    });
  }

  public async execute(message: Message) {
    if (message.author.bot) return;

    await handleLevelUp(message).catch(() => null);
    await this.handleTickets(message).catch(() => null);
  }

  private async handleTickets(message: Message) {
    if (!isGuildBasedChannel(message.channel)) return;
    if (!message.guild) return;

    const feature = await getGuildFeature(message.guild.id, 'TICKETS', true);
    if (!feature?.isEnabled) return;

    if (message.channel.parentId !== feature.data.categoryId) return;

    const ticket = await this.client.db.ticket.findFirst({
      where: { channelId: message.channel.id },
    });

    if (!ticket) return;

    await this.client.db.ticketLog.create({
      data: {
        message: message.content,
        userId: message.author.id,
        ticket: {
          connect: {
            id: ticket.id,
          },
        },
      },
    });
  }
}
