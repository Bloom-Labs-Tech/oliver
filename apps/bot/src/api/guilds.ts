import { z } from '@hono/zod-openapi';
import { ChannelType as DBChannelType, FeatureType } from '@prisma/client';
import { ChannelType, type ColorResolvable, type GuildChannelTypes } from 'discord.js';
import { createFactory } from '~/api/lib/helpers';
import {
  channelSchema,
  emojiSchema,
  errorSchema,
  guildPermissionMiddleware,
  guildSchema,
  inviteSchema,
  memberSchema,
  roleSchema,
  ticketSchema,
} from '~/api/lib/schemas';
import { db } from '~/database';
import {
  AllFeaturesSchema,
  formatAllFeaturesAsObject,
  getAllGuildFeatures,
  updateGuildFeature,
} from '~/services/common';
import { client } from '..';

enum GuildChannelTypeE {
  GuildText = 0,
  GuildVoice = 2,
  GuildCategory = 4,
  GuildAnnouncement = 5,
  GuildStageVoice = 13,
  GuildForum = 15,
  GuildMedia = 16,
}

const routes = createFactory();

routes.openapi(
  {
    method: 'get',
    path: '/:guildId',
    summary: 'Get the guild by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The guild by ID.',
        content: {
          'application/json': {
            schema: guildSchema,
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Guild not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    const guildSettings = await getAllGuildFeatures<{}>(guild.id);

    return c.json(
      {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.members.cache.filter((m) => !m.user.bot).size,
        settings: formatAllFeaturesAsObject(guildSettings) as unknown as z.infer<typeof AllFeaturesSchema>,
      },
      200,
    );
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/members',
    summary: 'Get the members of the guild by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The members of the guild by ID.',
        content: {
          'application/json': {
            schema: z.array(memberSchema),
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Guild not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const members = guild.members.cache
      .filter((u) => !u.user.bot)
      .map((m) => ({
        id: m.id,
        tag: m.user.tag,
        avatar: m.user.displayAvatarURL(),
        roles: m.roles.cache.filter((r) => r.id !== guild.id).map((r) => r.id),
        joinedAt: m.joinedAt?.toISOString() ?? null,
      }));

    return c.json(members, 200);
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/roles',
    summary: 'Get the roles of the guild by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The roles of the guild by ID.',
        content: {
          'application/json': {
            schema: z.array(roleSchema),
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Guild not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const roles = guild.roles.cache
      .filter((r) => r.id !== guild.id)
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        position: r.position,
      }));

    return c.json(roles, 200);
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/members/:memberId',
    summary: 'Get the member by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
        memberId: z.string({ description: 'The ID of the member.' }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The member by ID.',
        content: {
          'application/json': {
            schema: memberSchema,
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Member not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId, memberId } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const target = guild.members.cache.get(memberId);
    if (!target) return c.json({ message: 'Member not found.' }, 404);

    const dbUser = await db.guildMember.findUnique({
      where: {
        userId_guildId: {
          guildId: guild.id,
          userId: target.id,
        },
      },
      select: {
        xp: true,
        commandsSent: true,
        messagesSent: true,
        timeInVoice: true,
        user: {
          select: {
            lomUsername: true,
          },
        },
      },
    });

    return c.json(
      {
        id: target.id,
        tag: target.user.tag,
        avatar: target.user.displayAvatarURL(),
        roles: target.roles.cache.filter((r) => r.id !== guild.id).map((r) => r.id),
        xp: dbUser?.xp ?? 0,
        commandsSent: dbUser?.commandsSent ?? 0,
        messagesSent: dbUser?.messagesSent ?? 0,
        timeInVoice: dbUser?.timeInVoice ?? 0,
        lomUsername: dbUser?.user?.lomUsername ?? null,
        joinedAt: target.joinedAt?.toISOString() ?? null,
      },
      200,
    );
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/channels',
    summary: 'Get the channels of the guild by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The channels of the guild by ID.',
        content: {
          'application/json': {
            schema: z.array(
              channelSchema.extend({
                rawType: z.nativeEnum(ChannelType).openapi({
                  description: 'The raw type of the channel.',
                  example: 0,
                }),
              }),
            ),
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Guild not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const channels = guild.channels.cache.map((c) => {
      const cachedChannel = client.cached[guild.id].channels.find((cc) => cc.id === c.id);
      return {
        id: c.id,
        name: c.name,
        rawType: c.type,
        type: cachedChannel?.type ?? null,
        parentId: c.parent?.id ?? null,
      };
    });

    return c.json(channels, 200);
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/emojis',
    summary: 'Get the emojis of the guild by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The emojis of the guild by ID.',
        content: {
          'application/json': {
            schema: z.array(emojiSchema),
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Guild not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const emojis = guild.emojis.cache.map((e) => ({
      id: e.id,
      name: e.name,
      url: e.imageURL(),
      animated: e.animated ?? false,
    }));

    return c.json(emojis, 200);
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/invites',
    summary: 'Get the invites of the guild by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The invites of the guild by ID.',
        content: {
          'application/json': {
            schema: z.array(inviteSchema),
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Guild not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const invites = await guild.invites.fetch();

    return c.json(
      invites.map((i) => ({
        code: i.code,
        channelId: i.channel?.id ?? null,
        uses: i.uses ?? 0,
        maxUses: i.maxUses ?? 0,
        maxAge: i.maxAge ?? 0,
        temporary: i.temporary ?? false,
        createdAt: i.createdTimestamp ? new Date(i.createdTimestamp).toISOString() : null,
      })),
      200,
    );
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/roles/:roleId',
    summary: 'Get the role by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
        roleId: z.string({ description: 'The ID of the role.' }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The role by ID.',
        content: {
          'application/json': {
            schema: roleSchema,
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Role not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId, roleId } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const cachedRole = client.cached[guild.id].roles.find((r) => r.id === roleId);
    if (!cachedRole) return c.json({ message: 'Role not found.' }, 404);

    const role = guild.roles.cache.get(roleId);
    if (!role) return c.json({ message: 'Role not found.' }, 404);

    return c.json(
      {
        id: role.id,
        name: role.name,
        color: role.hexColor,
        position: role.position,
      },
      200,
    );
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/channels/:channelId',
    summary: 'Get the channel by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
        channelId: z.string({ description: 'The ID of the channel.' }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The channel by ID.',
        content: {
          'application/json': {
            schema: channelSchema,
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Channel not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId, channelId } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const cachedChannel = client.cached[guild.id].channels.find((c) => c.id === channelId);
    if (!cachedChannel) return c.json({ message: 'Channel not found.' }, 404);

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return c.json({ message: 'Channel not found.' }, 404);

    return c.json(
      {
        id: channel.id,
        name: channel.name,
        rawType: channel.type,
        type: cachedChannel.type ?? null,
        parentId: channel.parent?.id ?? null,
      },
      200,
    );
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/emojis/:emojiId',
    summary: 'Get the emoji by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
        emojiId: z.string({ description: 'The ID of the emoji.' }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The emoji by ID.',
        content: {
          'application/json': {
            schema: emojiSchema,
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Emoji not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId, emojiId } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const emoji = guild.emojis.cache.get(emojiId);
    if (!emoji) return c.json({ message: 'Emoji not found.' }, 404);

    return c.json(
      {
        id: emoji.id,
        name: emoji.name,
        url: emoji.url,
        animated: emoji.animated ?? false,
      },
      200,
    );
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/invites/:inviteCode',
    summary: 'Get the invite by code.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
        inviteCode: z.string({ description: 'The code of the invite.' }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The invite by code.',
        content: {
          'application/json': {
            schema: inviteSchema,
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Invite not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId, inviteCode } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const invite = await guild.invites.fetch();
    const i = invite.find((i) => i.code === inviteCode);
    if (!i) return c.json({ message: 'Invite not found.' }, 404);

    return c.json(
      {
        code: i.code,
        channelId: i.channel?.id ?? null,
        uses: i.uses ?? 0,
        maxUses: i.maxUses ?? 0,
        maxAge: i.maxAge ?? 0,
        temporary: i.temporary ?? false,
        createdAt: i.createdTimestamp ? new Date(i.createdTimestamp).toISOString() : null,
      },
      200,
    );
  },
);

routes.openapi(
  {
    method: 'post',
    path: '/:guildId/settings/:feature',
    summary: 'Update the settings of the guild by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
        feature: z.nativeEnum(FeatureType).openapi({
          description: 'The feature to update.',
          example: FeatureType.LEVELING,
        }),
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              isEnabled: z.boolean({ description: 'Whether the feature is enabled.' }).openapi({
                description: 'Whether the feature is enabled.',
                example: true,
              }),
              data: z.record(z.any()).optional().openapi({
                description: 'The data of the feature.',
              }),
            }),
          },
        },
      },
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The settings of the guild by ID.',
        content: {
          'application/json': {
            schema: z.object({
              isEnabled: z.boolean({ description: 'Whether the feature is enabled.' }).openapi({
                description: 'Whether the feature is enabled.',
                example: true,
              }),
              data: z.record(z.any()).optional().openapi({
                description: 'The data of the feature.',
              }),
            }),
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Guild not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      500: {
        description: 'Error updating settings.',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string({ description: 'The error message.' }),
              error: z.any({ description: 'The error.' }),
            }),
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId, feature } = c.req.valid('param');
    const body = c.req.valid('json');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const settings = await updateGuildFeature(guildId, feature, {
      isEnabled: body.isEnabled,
      data: body.data,
    });

    if (!settings) return c.json({ message: 'Error updating settings.' }, 500);

    return c.json(
      {
        isEnabled: settings.isEnabled,
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        data: settings.data as Record<string, any>,
      },
      200,
    );
  },
);

routes.openapi(
  {
    method: 'post',
    path: '/:guildId/roles',
    summary: 'Create a role in the guild by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              name: z.string({ description: 'The name of the role.' }),
              color: z.string({ description: 'The color of the role.' }).optional().nullable(),
              position: z.number({ description: 'The position of the role.' }).optional().nullable(),
            }),
          },
        },
      },
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The role created in the guild by ID.',
        content: {
          'application/json': {
            schema: roleSchema,
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Guild not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      500: {
        description: 'Error creating role.',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string({ description: 'The error message.' }),
              error: z.any({ description: 'The error.' }),
            }),
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId } = c.req.valid('param');
    const body = c.req.valid('json');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    try {
      const role = await guild.roles.create({
        name: body.name,
        color: (body.color as ColorResolvable) ?? undefined,
        position: body.position ?? undefined,
        permissions: [],
      });

      await db.role.create({
        data: {
          id: role.id,
          name: role.name,
          guildId: guild.id,
          color: role.hexColor,
        },
      });

      return c.json(
        {
          id: role.id,
          name: role.name,
          color: role.hexColor,
          position: role.position,
        },
        200,
      );
    } catch (error) {
      return c.json({ message: 'Error creating role.', error }, 500);
    }
  },
);

routes.openapi(
  {
    method: 'post',
    path: '/:guildId/channels',
    summary: 'Create a channel in the guild by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              name: z.string({ description: 'The name of the channel.' }),
              topic: z.string({ description: 'The topic of the channel.' }).optional().nullable(),
              rawType: z.nativeEnum(GuildChannelTypeE, { description: 'The raw type of the channel.' }),
              type: z.nativeEnum(DBChannelType).optional().nullable(),
              parentId: z.string({ description: 'The ID of the parent channel.' }).optional().nullable(),
            }),
          },
        },
      },
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The channel created in the guild by ID.',
        content: {
          'application/json': {
            schema: channelSchema,
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Guild not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      500: {
        description: 'Error creating channel.',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string({ description: 'The error message.' }),
              error: z.any({ description: 'The error.' }),
            }),
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId } = c.req.valid('param');
    const body = c.req.valid('json');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    try {
      const channel = await guild.channels.create({
        name: body.name,
        topic: body.topic ?? undefined,
        type: body.rawType as unknown as GuildChannelTypes,
        parent: body.parentId,
      });

      client.logger.info(`Created channel ${channel.name} in guild ${guild.name}.`, channel.id);

      const newChannel = await db.channel.upsert({
        where: { id: channel.id },
        update: {
          name: channel.name,
          type: body.type ?? DBChannelType.TEXT,
        },
        create: {
          id: channel.id,
          name: channel.name,
          guildId: guild.id,
          type: body.type ?? DBChannelType.TEXT,
        },
      });

      return c.json(
        {
          id: channel.id,
          name: channel.name,
          rawType: channel.type,
          type: newChannel.type ?? null,
          parentId: channel.parent?.id ?? null,
        },
        200,
      );
    } catch (error) {
      return c.json({ message: 'Error creating channel.', error }, 500);
    }
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/tickets',
    summary: 'Get the tickets in the guild by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The tickets in the guild by ID.',
        content: {
          'application/json': {
            schema: z.array(ticketSchema),
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Guild not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const tickets = await db.ticket.findMany({ where: { guildId } });

    return c.json(
      tickets.map((t) => ({
        id: t.id,
        userId: t.userId,
        channelId: t.channelId,
        createdAt: t.createdAt.toISOString(),
      })),
      200,
    );
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/tickets/:ticketId',
    summary: 'Get the ticket by ID.',
    tags: ['Guilds'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
        ticketId: z.string({ description: 'The ID of the ticket.' }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'The ticket by ID.',
        content: {
          'application/json': {
            schema: ticketSchema.extend({
              deletedAt: z.string({ description: 'The date the ticket was deleted.' }).optional().nullable(),
              closedAt: z.string({ description: 'The date the ticket was closed.' }).optional().nullable(),
              logs: z.array(
                z.object({
                  userId: z.string({ description: 'The ID of the user.' }).openapi({
                    description: 'The ID of the user.',
                    example: '1234567890',
                  }),
                  content: z.string({ description: 'The content of the log.' }).openapi({
                    description: 'The content of the log.',
                    example: 'Hello, world!',
                  }),
                  createdAt: z
                    .string({ description: 'The date the log was created.' })
                    .openapi({
                      description: 'The date the log was created.',
                      example: '2021-10-10T12:00:00.000Z',
                    })
                    .nullable(),
                }),
              ),
            }),
          },
        },
      },
      403: {
        description: 'User does not have permission.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Ticket not found.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId, ticketId } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const ticket = await db.ticket.findUnique({ where: { id: ticketId }, include: { logs: true } });

    if (!ticket) return c.json({ message: 'Ticket not found.' }, 404);

    return c.json(
      {
        id: ticket.id,
        userId: ticket.userId,
        channelId: ticket.channelId,
        deletedAt: ticket.deletedAt?.toISOString() ?? null,
        closedAt: ticket.closedAt?.toISOString() ?? null,
        createdAt: ticket.createdAt.toISOString(),
        logs: ticket.logs.map((l) => ({
          userId: l.userId,
          content: l.message,
          createdAt: l.createdAt.toISOString(),
        })),
      },
      200,
    );
  },
);

export default routes;
