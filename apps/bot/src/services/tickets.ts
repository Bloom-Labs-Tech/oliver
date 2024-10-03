import type { Ticket, TicketType } from '@prisma/client';
import { isGuildBasedChannel, isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { ActionRowBuilder, ButtonBuilder, ChannelType, Embed, Message, TextChannel } from 'discord.js';
import { client } from '~/index';
import {
  CustomEmbedBuilder,
  createTicketButtons,
  createVerificationAcceptedOrDeniedEmbed,
  createVerificationTokenAcceptDenyButtons,
  createVerificationTokenInstructionsEmbed,
} from '~/utils/embeds';
import { OliverError } from '~/utils/errors';
import { generateRandomString } from '~/utils/helpers';
import { getGuildFeature } from './common';

export const generateVerificationCode = (): string => generateRandomString(8);
export const generateTicketId = (): string => generateRandomString(6);

// Helper function to fetch ticket and related channel
async function findTicketAndChannel(
  ticketId: string,
): Promise<{ ticket: Ticket | null; channel: TextChannel | null; firstMessage: Message | null }> {
  const ticket = await client.db.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { ticket: null, channel: null, firstMessage: null };

  const channel = client.channels.cache.get(ticket.channelId);
  if (!isGuildBasedChannel(channel) || !isTextBasedChannel(channel))
    return { ticket: null, channel: null, firstMessage: null };

  const messages = await channel.messages.fetch();
  const firstMessage = messages.first();
  if (!firstMessage) return { ticket: null, channel: null, firstMessage: null };

  return { ticket, channel: channel as TextChannel, firstMessage };
}

// Helper to edit the first message in a channel
async function editFirstMessage(
  channel: TextChannel,
  content: string,
  embed: CustomEmbedBuilder | Embed,
  components: ActionRowBuilder<ButtonBuilder>[],
) {
  const messages = await channel.messages.fetch();
  const firstMessage = messages.first();

  if (firstMessage?.editable) {
    await firstMessage.edit({
      content,
      embeds: [embed],
      components,
    });
  }
}

export async function createTicket(
  userId: string,
  guildId: string,
  type: TicketType,
  username?: string,
): Promise<{ channel: TextChannel | null; ticket: Ticket | null }> {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) throw new OliverError('Guild not found.');

    const ticketFeature = await getGuildFeature(guildId, 'TICKETS', true);
    if (!ticketFeature?.isEnabled) throw new OliverError('Ticket feature is not enabled.');

    const ticketCategory = client.channels.cache.get(ticketFeature.data.categoryId);
    if (!isGuildBasedChannel(ticketCategory)) throw new OliverError('Ticket category not found.');

    const ticketId = generateTicketId();
    const ticketChannel = await guild.channels.create({
      name: `${type.toLowerCase()}-${ticketId}`,
      type: ChannelType.GuildText,
      parent: ticketCategory.id,
      permissionOverwrites: [
        { id: userId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
        { id: guildId, deny: ['ViewChannel'] },
      ],
    });

    const newTicket = await client.db.ticket.create({
      data: {
        id: ticketId,
        channelId: ticketChannel.id,
        type,
        userId,
        username,
        guildId,
      },
    });

    return { channel: ticketChannel, ticket: newTicket };
  } catch (error) {
    client.logger.error('Error creating ticket:', error);
    return { channel: null, ticket: null };
  }
}

export async function createVerificationTicket(
  userId: string,
  guildId: string,
  username?: string,
): Promise<{ channel: TextChannel | null; ticket: Ticket | null }> {
  const type = "VERIFICATION";

  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) throw new OliverError('Guild not found.');

    const ticketFeature = await getGuildFeature(guildId, 'LEGENDOFMUSHROOM', true);
    if (!ticketFeature?.isEnabled) throw new OliverError('Ticket feature is not enabled.');

    const ticketCategory = client.channels.cache.get(ticketFeature.data.verification.categoryId);
    if (!isGuildBasedChannel(ticketCategory)) throw new OliverError('Ticket category not found.');

    const ticketId = generateTicketId();
    const ticketChannel = await guild.channels.create({
      name: `${type.toLowerCase()}-${ticketId}`,
      type: ChannelType.GuildText,
      parent: ticketCategory.id,
      permissionOverwrites: [
        { id: userId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
        { id: guildId, deny: ['ViewChannel'] },
      ],
    });

    const newTicket = await client.db.ticket.create({
      data: {
        id: ticketId,
        channelId: ticketChannel.id,
        type,
        userId,
        username,
        guildId,
      },
    });

    return { channel: ticketChannel, ticket: newTicket };
  } catch (error) {
    client.logger.error('Error creating ticket:', error);
    return { channel: null, ticket: null };
  }
}

export async function closeTicket(ticketId: string, remove: boolean): Promise<boolean> {
  try {
    const { ticket, channel, firstMessage } = await findTicketAndChannel(ticketId);
    if (!ticket || !channel || !firstMessage) return false;

    await client.db.ticket.update({
      where: { id: ticketId },
      data: { closedAt: new Date(), deletedAt: remove ? new Date() : null },
    });

    if (remove) {
      await channel.delete();
      return true;
    }

    await editFirstMessage(channel, '', firstMessage.embeds[0], [createTicketButtons(ticketId, true)]);
    return true;
  } catch (error) {
    client.logger.error('Error closing ticket:', error);
    return false;
  }
}

export async function claimVerificationTicket(ticketId: string, staffUserId: string) {
  try {
    client.logger.info('Claiming verification ticket:', ticketId);
    const { ticket, channel } = await findTicketAndChannel(ticketId);
    if (!ticket?.username || !ticket?.userId || !channel) throw new OliverError('Ticket not found.');

    const verificationToken = generateVerificationCode();

    await client.db.user.upsert({
      where: { id: ticket.userId },
      update: { lomVerificationCode: verificationToken },
      create: { id: ticket.userId, lomVerificationCode: verificationToken },
    });

    const staffUser = await client.db.user.findUnique({ where: { id: staffUserId } });
    if (!staffUser?.lomUsername) throw new OliverError('Staff user not found.');

    const buttons = createVerificationTokenAcceptDenyButtons(ticketId);

    const embed = createVerificationTokenInstructionsEmbed(
      verificationToken,
      ticket.userId,
      ticket.username,
      staffUser.lomUsername,
    );

    const firstMessage = channel.messages.cache.first();
    if (!firstMessage) throw new OliverError('First message not found.');

    await editFirstMessage(channel, '', embed, [buttons]);
    return true;
  } catch (err) {
    client.logger.error('Error claiming verification ticket:', err);
    return false;
  }
}

export async function verifyUserTicket(ticketId: string) {
  try {
    const { ticket, channel } = await findTicketAndChannel(ticketId);
    if (!ticket?.username || !ticket?.userId || !channel) return false;

    const feature = await getGuildFeature(ticket.guildId, 'LEGENDOFMUSHROOM', true);
    if (!feature?.isEnabled || !feature?.data?.verification.isEnabled) throw new OliverError('Feature not enabled.');

    await client.db.user.update({
      where: { id: ticket.userId },
      data: { lomUsername: ticket.username },
    });

    await closeTicket(ticketId, true);

    const member = await channel.guild.members.fetch(ticket.userId);
    if (!member) throw new OliverError('Member not found.');

    const verifiedRoles = feature.data.verification.roles;

    if (verifiedRoles.length) {
      await member.roles.add(verifiedRoles);
    }

    let dmChannel = member.dmChannel;
    if (!dmChannel) {
      dmChannel = await member.createDM(true).catch(() => null);
    }

    if (dmChannel) {
      await dmChannel.send({
        embeds: [createVerificationAcceptedOrDeniedEmbed(true, member.id)],
      });
    }

    return true;
  } catch (err) {
    client.logger.error('Error verifying user ticket:', err);
    return false;
  }
}

export async function rejectUserTicket(ticketId: string) {
  try {
    const { ticket } = await findTicketAndChannel(ticketId);
    if (!ticket?.username || !ticket?.userId) return false;

    const member = await client.guilds.cache.get(ticket.guildId)?.members.fetch(ticket.userId);

    let dmChannel = member?.dmChannel;
    if (!dmChannel) {
      dmChannel = await member?.createDM(true).catch(() => null);
    }

    if (dmChannel && member) {
      await dmChannel.send({
        embeds: [createVerificationAcceptedOrDeniedEmbed(true, member.id)],
      });
    }

    await closeTicket(ticketId, true);
    return true;
  } catch (err) {
    client.logger.error('Error rejecting user ticket:', err);
    return false;
  }
}
