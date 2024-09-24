import { z } from '@hono/zod-openapi';
import { ChannelType as DBChannelType } from '@prisma/client';
import { ChannelType, type GuildChannelTypes } from 'discord.js';
import { createFactory } from '~/api/lib/helpers';
import {
  channelSchema,
  errorSchema,
  guildPermissionMiddleware
} from '~/api/lib/schemas';
import { client } from '~/index';

const routes = createFactory();

enum GuildChannelEnum {
  GuildText = 0,
  GuildVoice = 2,
  GuildCategory = 4,
  GuildAnnouncement = 5,
  GuildStageVoice = 13,
  GuildForum = 15,
  GuildMedia = 16,
}

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/channels',
    summary: 'List all channels in a guild',
    tags: ['Channels'],
    description: 'Retrieves a list of all channels within the specified guild, including their IDs, names, types, and parent channels if applicable.',
    request: {
      params: z.object({
        guildId: z.string().openapi({
          description: 'Unique identifier of the guild.',
          example: '1234567890',
        }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'A list of channels in the guild.',
        content: {
          'application/json': {
            schema: z.array(
              channelSchema.extend({
                rawType: z.nativeEnum(ChannelType).openapi({
                  description: 'The raw type of the channel as defined by Discord.',
                  example: ChannelType.GuildText,
                }),
              }),
            ),
          },
        },
      },
      403: {
        description: 'Forbidden: User does not have permission to access these channels.',
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
    const { isValid, message, status, guild } = await guildPermissionMiddleware(c);
    client.logger.info(`[API] Accessed the API for channels in guild ${guild?.name} (${guildId})`);
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
    path: '/:guildId/channels/:channelId',
    summary: 'Retrieve a specific channel in a guild by channel ID',
    tags: ['Channels'],
    description: 'Fetches details of a specific channel within the specified guild using the channel\'s ID.',
    request: {
      params: z.object({
        guildId: z.string().openapi({
          description: 'Unique identifier of the guild.',
          example: '1234567890',
        }),
        channelId: z.string().openapi({
          description: 'Unique identifier of the channel.',
          example: '0987654321',
        }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'Details of the requested channel.',
        content: {
          'application/json': {
            schema: channelSchema.extend({
              rawType: z.nativeEnum(ChannelType).openapi({
                description: 'The raw type of the channel as defined by Discord.',
                example: ChannelType.GuildText,
              }),
            }),
          },
        },
      },
      403: {
        description: 'Forbidden: User does not have permission to access this channel.',
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
    method: 'post',
    path: '/:guildId/channels',
    summary: 'Create a new channel in a guild',
    tags: ['Channels'],
    description: 'Creates a new channel within the specified guild with the given properties such as name, topic, type, and parent channel.',
    request: {
      params: z.object({
        guildId: z.string().openapi({
          description: 'Unique identifier of the guild.',
          example: '1234567890',
        }),
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              name: z.string().openapi({
                description: 'The name of the new channel.',
                example: 'general',
              }),
              topic: z.string().optional().nullable().openapi({
                description: 'The topic of the channel.',
                example: 'Discussion about general topics',
              }),
              rawType: z.nativeEnum(GuildChannelEnum).openapi({
                description: 'The raw type of the channel as defined by Discord.',
                example: GuildChannelEnum.GuildText,
              }),
              type: z.nativeEnum(DBChannelType).optional().nullable().openapi({
                description: 'Custom type assigned to the channel in the database.',
                example: DBChannelType.TEXT,
              }),
              parentId: z.string().optional().nullable().openapi({
                description: 'The ID of the parent category channel if applicable.',
                example: '1122334455',
              }),
            }),
          },
        },
      },
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'Details of the newly created channel.',
        content: {
          'application/json': {
            schema: channelSchema.extend({
              rawType: z.nativeEnum(ChannelType).openapi({
                description: 'The raw type of the channel as defined by Discord.',
                example: ChannelType.GuildText,
              }),
            }),
          },
        },
      },
      403: {
        description: 'Forbidden: User does not have permission to create channels in this guild.',
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
        description: 'Internal Server Error: Error occurred while creating the channel.',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string().openapi({
                description: 'Description of the error.',
              }),
              error: z.any().openapi({
                description: 'Detailed error information.',
              }),
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

      const newChannel = await client.db.channel.upsert({
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

      const data = {
        id: channel.id,
        name: channel.name,
        rawType: channel.type,
        type: newChannel.type ?? null,
        parentId: channel.parent?.id ?? null,
      };

      return c.json(data, 200);
    } catch (error) {
      return c.json({ message: 'Error creating channel.', error }, 500);
    }
  },
);

export default routes;