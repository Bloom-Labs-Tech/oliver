import { z } from '@hono/zod-openapi';
import { createFactory } from '~/api/lib/helpers';
import {
  emojiSchema,
  errorSchema,
  guildPermissionMiddleware
} from '~/api/lib/schemas';
import { client } from '~/index';

const routes = createFactory();

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/emojis',
    summary: 'List all emojis in a guild',
    tags: ['Emojis'],
    description: 'Retrieves a list of all custom emojis available in the specified guild, including their IDs, names, URLs, and whether they are animated.',
    request: {
      params: z.object({
        guildId: z.string().openapi({
          description: 'Unique identifier of the guild.',
          example: '123456789012345678',
        }),
      }),
      query: z.object({
        limit: z.number({ coerce: true }).optional().openapi({
          description: 'The maximum number of emojis to return.',
          example: 100,
        }),
        page: z.number({ coerce: true }).optional().openapi({
          description: 'The page number to return.',
          example: 1,
        }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'A list of emojis in the guild.',
        content: {
          'application/json': {
            schema: z.object({
              total: z.number().openapi({
                description: 'Total number of emojis retrieved.',
                example: 123,
              }),
              page: z.number().openapi({
                description: 'The current page number.',
                example: 1,
              }),
              limit: z.number().openapi({
                description: 'The maximum number of emojis per page.',
                example: 25,
              }),
              emojis: z.array(
                emojiSchema.openapi({
                  description: 'An emoji object.',
                  example: {
                    id: '987654321098765432',
                    name: 'smile',
                    url: 'https://cdn.discordapp.com/emojis/987654321098765432.png',
                    animated: false,
                  },
                }),
              ),
            })
          },
        },
      },
      403: {
        description: 'Forbidden: User does not have permission to access these emojis.',
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
    const { limit = 50, page = 1 } = c.req.valid('query');
    const { guildId } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);
    const emojiLimit = Math.min(Math.max(1, limit), 100); // Min 1, Max 100

    const emojis = guild.emojis.cache.map((e) => ({
      id: e.id,
      name: e.name,
      url: e.url,
      animated: e.animated ?? false,
    })).slice((page - 1) * emojiLimit, page * emojiLimit);
    const total = guild.emojis.cache.size;

    return c.json({
      total,
      page,
      limit: emojiLimit,
      emojis,
    }, 200);
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/emojis/:emojiId',
    summary: 'Retrieve a specific emoji in a guild by emoji ID',
    tags: ['Emojis'],
    description: 'Fetches details of a specific custom emoji within the specified guild using the emoji\'s ID.',
    request: {
      params: z.object({
        guildId: z.string().openapi({
          description: 'Unique identifier of the guild.',
          example: '123456789012345678',
        }),
        emojiId: z.string().openapi({
          description: 'Unique identifier of the emoji.',
          example: '987654321098765432',
        }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'Details of the requested emoji.',
        content: {
          'application/json': {
            schema: emojiSchema.openapi({
              description: 'An emoji object.',
              example: {
                id: '987654321098765432',
                name: 'smile',
                url: 'https://cdn.discordapp.com/emojis/987654321098765432.png',
                animated: false,
              },
            }),
          },
        },
      },
      403: {
        description: 'Forbidden: User does not have permission to access this emoji.',
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

export default routes;