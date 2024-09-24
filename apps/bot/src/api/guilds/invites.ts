import { z } from '@hono/zod-openapi';
import { createFactory } from '~/api/lib/helpers';
import {
  errorSchema,
  guildPermissionMiddleware,
  inviteSchema
} from '~/api/lib/schemas';
import { client } from '~/index';

const routes = createFactory();

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/invites',
    summary: 'List all invites in a guild',
    tags: ['Invites'],
    description: 'Retrieves a list of all active invites for the specified guild, including their codes, usage statistics, expiration times, and other relevant details.',
    request: {
      params: z.object({
        guildId: z.string().openapi({
          description: 'Unique identifier of the guild.',
          example: '123456789012345678',
        }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'A list of invites in the guild.',
        content: {
          'application/json': {
            schema: z.array(
              inviteSchema.openapi({
                description: 'An invite object.',
                example: {
                  code: 'abcdef',
                  channelId: '987654321098765432',
                  uses: 10,
                  maxUses: 100,
                  maxAge: 3600,
                  temporary: false,
                  createdAt: '2023-10-01T12:34:56.789Z',
                },
              }),
            ),
          },
        },
      },
      403: {
        description: 'Forbidden: User does not have permission to access these invites.',
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
    path: '/:guildId/invites/:inviteCode',
    summary: 'Retrieve a specific invite in a guild by invite code',
    tags: ['Invites'],
    description: 'Fetches details of a specific invite within the specified guild using the invite code, including usage statistics and expiration details.',
    request: {
      params: z.object({
        guildId: z.string().openapi({
          description: 'Unique identifier of the guild.',
          example: '123456789012345678',
        }),
        inviteCode: z.string().openapi({
          description: 'Unique code of the invite.',
          example: 'abcdef',
        }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'Details of the requested invite.',
        content: {
          'application/json': {
            schema: inviteSchema.openapi({
              description: 'An invite object.',
              example: {
                code: 'abcdef',
                channelId: '987654321098765432',
                uses: 10,
                maxUses: 100,
                maxAge: 3600,
                temporary: false,
                createdAt: '2023-10-01T12:34:56.789Z',
              },
            }),
          },
        },
      },
      403: {
        description: 'Forbidden: User does not have permission to access this invite.',
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

export default routes;
