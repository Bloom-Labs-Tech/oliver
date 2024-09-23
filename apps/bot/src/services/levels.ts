import { FeatureType } from '@prisma/client';
import { isGuildBasedChannel } from '@sapphire/discord.js-utilities';
import { CommandInteraction, Message, VoiceState } from 'discord.js';
import { client } from '~/index';
import { createLevelUpEmbed } from '~/utils/embeds';
import { type ParsedGuildFeature, getGuildFeature } from './common';

export enum ActionMultiplier {
  Interaction = 1.2,
  Message = 1.1,
  Task = 1.5,
  Voice = 1.3,
}

export const XP_COOLDOWN = 30 * 1000; // 30 seconds

export const calculateTimeBonus = (start: Date | null, end: Date): [number, number] => {
  const diff = end.getTime() - (start?.getTime() || end.getTime());
  const minutes = diff / 1000 / 60;
  const bonus = Math.floor(minutes / 10) + 1;
  return [bonus, bonus * 1.5];
};

export const calculateXP = (
  baseXP: number,
  actionMultiplier: ActionMultiplier,
  userLevel: number,
  randomBonusRange: [number, number],
): number => {
  const levelMultiplier = 1 + userLevel * 0.05;
  const randomBonus = Math.random() * (randomBonusRange[1] - randomBonusRange[0]) + randomBonusRange[0];
  return Math.floor(baseXP * actionMultiplier * levelMultiplier + randomBonus);
};

export const calculateXPForNextLevel = (level: number): number => Math.floor(1000 * 1.2 ** level);

export const calculateLevelFromXP = (xp: number): number => {
  let level = 1;
  let requiredXP = calculateXPForNextLevel(level);

  while (xp >= requiredXP) {
    level++;
    requiredXP = calculateXPForNextLevel(level);
  }

  return level;
};

export const calculateTimeInVoice = (joinedVoiceAt: Date | null, leftVoiceAt: Date): number => {
  if (!joinedVoiceAt) return 0;
  return Math.floor((leftVoiceAt.getTime() - joinedVoiceAt.getTime()) / 1000);
};

export async function handleLevelUp(
  ctx: CommandInteraction | Message | VoiceState,
  bypassCooldown = false,
): Promise<void> {
  const userId =
    ctx instanceof CommandInteraction
      ? ctx.user.id
      : ctx instanceof VoiceState
        ? (ctx.member?.id as string)
        : ctx.author.id;

  if (!ctx.guild) {
    client.logger.error('Guild not found in context.');
    return;
  }

  try {
    const levelingFeature = await getGuildFeature(ctx.guild.id, FeatureType.LEVELING, true);
    if (!levelingFeature?.isEnabled) return; // Early exit if leveling is disabled

    const user = await client.db.guildMember
      .upsert({
        where: { userId_guildId: { userId, guildId: ctx.guild.id } },
        update: {},
        create: { userId, guildId: ctx.guild.id },
      })
      .catch(() => null);

    if (!user) return;

    const isCooldownOver = new Date(user.xpCooldown).getTime() + XP_COOLDOWN < Date.now();
    const bonus: [number, number] =
      ctx instanceof VoiceState ? calculateTimeBonus(user.joinedVoiceAt, new Date()) : [0, 5];

    const newXp = calculateXP(10, ActionMultiplier.Interaction, calculateLevelFromXP(user.xp), bonus);

    client.logger.debug(`User ${userId} has ${user.xp} XP and will receive ${newXp} XP`, {
      userId,
      xp: user.xp,
      newXp,
      XP_COOLDOWN,
      isCooldownOver,
      bonus,
      cooldown: user.xpCooldown,
    });

    const xpIncrement = isCooldownOver || bypassCooldown ? newXp : 0;
    const xpCooldownUpdate = isCooldownOver || bypassCooldown ? { xpCooldown: new Date() } : {};

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const updateData: Record<string, any> = {
      ...(ctx instanceof CommandInteraction && { commandsSent: { increment: 1 } }),
      ...(ctx instanceof Message && { messagesSent: { increment: 1 } }),
      ...(ctx instanceof VoiceState && {
        timeInVoice: { increment: calculateTimeInVoice(user.joinedVoiceAt, new Date()) },
        joinedVoiceAt: null,
      }),
      xp: { increment: xpIncrement },
      ...xpCooldownUpdate,
    };

    const updatedUser = await client.db.guildMember.update({
      where: { userId_guildId: { userId, guildId: ctx.guild.id } },
      data: updateData,
    });

    const levelChannelId = levelingFeature.data.channelId;
    if (levelChannelId && hasLeveledUp(updatedUser.xp, user.xp)) {
      await handleLevelUpMessage(ctx, userId, updatedUser.xp, user.xp, levelingFeature, levelChannelId);
    }
  } catch (error) {
    client.logger.error('Error during level up handling:', error);
  }
}

async function handleLevelUpMessage(
  ctx: CommandInteraction | Message | VoiceState,
  userId: string,
  newXp: number,
  oldXp: number,
  levelingFeature: ParsedGuildFeature<'LEVELING', true>,
  levelChannelId: string,
) {
  const levelChannel = client.channels.cache.get(levelChannelId);
  if (!isGuildBasedChannel(levelChannel)) return;

  const newLevel = calculateLevelFromXP(newXp);
  const oldLevel = calculateLevelFromXP(oldXp);

  if (newLevel > oldLevel) {
    const levelRoles = levelingFeature.data.roles;
    const member = await ctx.guild?.members.fetch(userId);

    if (levelRoles.length && member) {
      const rolesToAdd = ctx.guild?.roles.cache
        .filter((role) => levelRoles.some((r) => r.id === role.id && r.level === newLevel))
        .filter((role) => !member.roles.cache.has(role.id));

      if (rolesToAdd?.size) {
        await member.roles.add(rolesToAdd);
        const highestRole = rolesToAdd.first();
        await levelChannel.send({
          embeds: [createLevelUpEmbed(userId, newXp, highestRole)],
        });
      }
    } else {
      await levelChannel.send({
        embeds: [createLevelUpEmbed(userId, newXp)],
      });
    }
  }
}

function hasLeveledUp(newXp: number, oldXp: number): boolean {
  return calculateLevelFromXP(newXp) > calculateLevelFromXP(oldXp);
}
