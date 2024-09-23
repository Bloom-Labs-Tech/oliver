import { ChannelType, type VoiceState } from 'discord.js';
import { getGuildFeature } from '~/services/common';
import {
  ActionMultiplier,
  calculateLevelFromXP,
  calculateTimeBonus,
  calculateTimeInVoice,
  calculateXP,
  handleLevelUp,
} from '~/services/levels';
import { OliverEvent } from '../client';

export default class Event extends OliverEvent<'voiceStateUpdate'> {
  public constructor() {
    super('voiceStateUpdate', {
      runOnce: false,
    });
  }

  public async execute(oldState: VoiceState, newState: VoiceState) {
    if (oldState.channelId === null && newState.channelId) {
      return this.handleJoin(oldState, newState);
    }

    if (oldState.channelId && newState.channelId === null) {
      return this.handleLeave(oldState, newState);
    }

    if (oldState.channelId !== newState.channelId) {
      return this.handleSwitch(oldState, newState);
    }

    return;
  }

  private async handleJoin(_: VoiceState, newState: VoiceState) {
    const member = newState.member;
    if (!member || member?.user.bot) return;

    const feature = await getGuildFeature(newState.guild.id, 'VOICE', true);
    if (!feature?.isEnabled) return;

    const user = await this.client.db.guildMember
      .upsert({
        where: { userId_guildId: { userId: member.id, guildId: member.guild.id } },
        update: {
          joinedVoiceAt: new Date(),
        },
        create: {
          userId: member.id,
          guildId: member.guild.id,
          joinedVoiceAt: new Date(),
        },
      })
      .catch(() => null);
    if (!user) return;

    const channel = newState.channel;
    if (!channel) return;

    if (channel.id === feature.data.channelId) {
      const newChannel = await channel.guild.channels.create({
        name: `${member.displayName}'s Channel`,
        type: ChannelType.GuildVoice,
        parent: feature.data.categoryId,
        permissionOverwrites: [
          {
            id: member.id,
            allow: ['ManageChannels', 'ManageRoles', 'ViewChannel', 'Connect', 'Speak', 'Stream'],
          },
        ],
      });

      await member.voice.setChannel(newChannel);
    }
  }

  private async handleLeave(oldState: VoiceState, _: VoiceState) {
    const member = oldState.member;
    if (!member || member?.user.bot) return;

    try {
      const feature = await getGuildFeature(oldState.guild.id, 'VOICE', true);
      if (!feature?.isEnabled) return;

      const channel = oldState.channel;
      if (!channel) return;

      if (channel.id === feature.data.channelId) return;

      const isTempChannel = channel.name.endsWith("'s Channel") && channel.parentId === feature.data.categoryId;
      const isMemberInChannel = channel.members.size > 0;

      if (isTempChannel && !isMemberInChannel) {
        await channel.delete();
      }
    } catch (_) {}

    await handleLevelUp(oldState).catch(() => null);
  }

  private async handleSwitch(oldState: VoiceState, newState: VoiceState) {
    const member = newState.member;
    if (!member || member?.user.bot) return;

    try {
      const leftVoiceAt = new Date();
      const user = await this.client.db.guildMember
        .upsert({
          where: { userId_guildId: { userId: member.id, guildId: member.guild.id } },
          update: {},
          create: {
            userId: member.id,
            guildId: member.guild.id,
          },
        })
        .catch(() => null);

      if (user) {
        const level = calculateLevelFromXP(user.xp);
        const bonus = calculateTimeBonus(user.joinedVoiceAt, leftVoiceAt);
        const newXP = calculateXP(10, ActionMultiplier.Voice, level, bonus);
        await this.client.db.guildMember.update({
          where: { userId_guildId: { userId: member.id, guildId: member.guild.id } },
          data: {
            xp: {
              increment: newXP,
            },
            timeInVoice: {
              increment: calculateTimeInVoice(user.joinedVoiceAt, leftVoiceAt),
            },
            joinedVoiceAt: new Date(),
          },
        });
      }
    } catch (_) {}

    const feature = await getGuildFeature(newState.guild.id, 'VOICE', true);
    if (!feature?.isEnabled) return;

    try {
      const channel = oldState.channel;
      if (!channel) return;

      if (channel.id === feature.data.channelId) return;

      const isTempChannel = channel.name.endsWith("'s Channel") && channel.parentId === feature.data.categoryId;
      const isMemberInChannel = channel.members.size > 0;

      if (isTempChannel && !isMemberInChannel) {
        await channel.delete();
      }
    } catch (_) {}

    try {
      const channel = newState.channel;
      if (!channel) return;

      if (channel.id === feature.data.channelId) {
        const newChannel = await channel.guild.channels.create({
          name: `${member.displayName}'s Channel`,
          type: ChannelType.GuildVoice,
          parent: feature.data.categoryId,
          permissionOverwrites: [
            {
              id: member.id,
              allow: ['ManageChannels', 'ManageRoles', 'ViewChannel', 'Connect', 'Speak', 'Stream'],
            },
          ],
        });

        await member.voice.setChannel(newChannel);
      }

      await handleLevelUp(newState).catch(() => null);
    } catch (_) {}
  }
}
