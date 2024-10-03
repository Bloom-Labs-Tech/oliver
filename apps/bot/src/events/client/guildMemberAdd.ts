import { isTextChannel } from '@sapphire/discord.js-utilities';
import type { GuildMember } from 'discord.js';
import { OliverEvent } from '~/client';
import { GreetingsCard } from '~/services/cards/greetingCard';
import { getGuildFeature } from '~/services/common';
import { CommandExecutionError } from '~/utils/errors';
import { getOrdinalSuffix } from '~/utils/helpers';

export default class OliverGuildMemberAddEvent extends OliverEvent<'guildMemberAdd'> {
  public constructor() {
    super('guildMemberAdd', {
      runOnce: false,
    });
  }

  public async execute(member: GuildMember): Promise<void> {
    const autoRoleFeature = await getGuildFeature(member.guild.id, 'AUTOROLE');

    if (autoRoleFeature?.isEnabled) {
      const roles = autoRoleFeature.data?.roles;
      if (roles) {
        await member.roles.add(roles);
      }
    }

    const feature = await getGuildFeature(member.guild.id, 'WELCOME');
    if (!feature?.isEnabled) return;

    const card = new GreetingsCard()
      .setDisplayName(member.displayName)
      .setAvatar(member.user.displayAvatarURL({ extension: 'png' }))
      .setMessage(`You\'re the ${member.guild.memberCount}${getOrdinalSuffix(member.guild.memberCount)} member!`);

    const image = await card.build();

    const welcomeChannelId = feature.data?.channelId;
    if (!welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(welcomeChannelId);

    if (!channel) {
      throw new CommandExecutionError(`Channel not found: ${welcomeChannelId}`);
    }

    if (!isTextChannel(channel)) {
      throw new CommandExecutionError(`Channel is not a text channel: ${welcomeChannelId}`);
    }

    await channel.send({ files: [image] });
  }
}
