import { isTextChannel } from '@sapphire/discord.js-utilities';
import type { GuildMember } from 'discord.js';
import { OliverEvent } from '~/client';
import { GreetingsCard } from '~/services/cards/greetingCard';
import { getGuildFeature } from '~/services/common';
import { CommandExecutionError } from '~/utils/errors';

export default class OliverGuildMemberRemoveEvent extends OliverEvent<'guildMemberRemove'> {
  public constructor() {
    super('guildMemberRemove', {
      runOnce: false,
    });
  }

  public async execute(member: GuildMember): Promise<void> {
    await this.client.db.user
      .upsert({
        where: { id: member.id },
        update: {
          guilds: {
            upsert: {
              where: { userId_guildId: { userId: member.id, guildId: member.guild.id } },
              update: {
                deletedAt: new Date(),
              },
              create: {
                guildId: member.guild.id,
              },
            },
          },
        },
        create: {
          id: member.id,
          guilds: {
            connectOrCreate: {
              where: { userId_guildId: { userId: member.id, guildId: member.guild.id } },
              create: {
                guildId: member.guild.id,
                deletedAt: new Date(),
              },
            },
          },
        },
      })
      .catch(() => null);

    const feature = await getGuildFeature(member.guild.id, 'GOODBYE', true);
    if (!feature?.isEnabled) {
      return;
    }

    const card = new GreetingsCard()
      .setDisplayName(member.displayName)
      .setType('goodbye')
      .setAvatar(member.user.displayAvatarURL({ extension: 'png' }));

    const image = await card.build();

    const channel = member.guild.channels.cache.get(feature.data.channelId);

    if (!channel) {
      throw new CommandExecutionError(`Channel not found: ${feature.data.channelId}`);
    }

    if (!isTextChannel(channel)) {
      throw new CommandExecutionError(`Channel is not a text channel: ${feature.data.channelId}`);
    }

    await channel.send({ files: [image] });
  }
}
