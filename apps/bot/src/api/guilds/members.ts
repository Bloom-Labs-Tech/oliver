import { z } from '@hono/zod-openapi';
import { createFactory } from '~/api/lib/helpers';
import {
  errorSchema,
  guildPermissionMiddleware,
  memberSchema
} from '~/api/lib/schemas';
import { client } from '~/index';
import { calculateLevelFromXP } from '~/services/levels';

const routes = createFactory();

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/members',
    summary: 'List all members in a guild',
    tags: ['Members'],
    description: 'Retrieves a list of all non-bot members within the specified guild, including their IDs, tags, avatars, roles, and join dates.',
    request: {
      query: z.object({
        limit: z.number().optional().openapi({
          description: 'The maximum number of members to return.',
          example: 100,
        }),
        page: z.number().optional().openapi({
          description: 'The page number to return.',
          example: 1,
        }),
      }),
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
        description: 'A list of members in the guild.',
        content: {
          'application/json': {
            schema: z.object({
              total: z.number().openapi({
                description: 'Total number of members retrieved.',
                example: 123,
              }),
              page: z.number().openapi({
                description: 'The current page number.',
                example: 1,
              }),
              limit: z.number().openapi({
                description: 'The maximum number of members per page.',
                example: 25,
              }),
              members: z.array(
                memberSchema.openapi({
                  description: 'A guild member object.',
                  example: {
                    id: '987654321098765432',
                    tag: 'User#1234',
                    avatar: 'https://cdn.discordapp.com/avatars/987654321098765432/abcdef1234567890.png',
                    roles: ['111111111111111111', '222222222222222222'],
                    joinedAt: '2023-10-01T12:34:56.789Z',
                    commandsSent: 50,
                    messagesSent: 200,
                    timeInVoice: 3600,
                    level: 3,
                    xp: 1500,
                    lomUsername: 'UserInLOM',
                  },
                }),
              )
            }),
          },
        },
      },
      403: {
        description: 'Forbidden: User does not have permission to access this guild.',
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
    const { limit = 25, page = 1 } = c.req.valid('query');
    const { isValid, message, status, guild } = await guildPermissionMiddleware(c);
    client.logger.info(`[API] Accessed the API for ${guild?.name} (${guildId})`);
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const members = guild.members.cache
      .filter((m) => !m.user.bot)
      .map((m) => ({
        id: m.id,
        tag: m.user.tag,
        avatar: m.user.displayAvatarURL(),
        roles: m.roles.cache.filter((r) => r.id !== guild.id).map((r) => r.id),
        joinedAt: m.joinedAt?.toISOString() ?? null,
      })).slice((page - 1) * limit, page * limit);

    const guildMembers = await client.db.guildMember.findMany({
      where: {
        guildId,
        userId: {
          in: members.map((m) => m.id),
        },
      },
      select: {
        userId: true,
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

    const mappedMembers = members.map((m) => {
      const dbUser = guildMembers.find((gm) => gm.userId === m.id);
      return {
        ...m,
        xp: dbUser?.xp ?? 0,
        level: calculateLevelFromXP(dbUser?.xp ?? 0),
        commandsSent: dbUser?.commandsSent ?? 0,
        messagesSent: dbUser?.messagesSent ?? 0,
        timeInVoice: dbUser?.timeInVoice ?? 0,
        lomUsername: dbUser?.user?.lomUsername ?? null,
      };
    });

    return c.json({
      total: guild.members.cache.filter((m) => !m.user.bot).size,
      page,
      limit,
      members: mappedMembers,
    }, 200);
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/members/:memberId',
    summary: 'Retrieve a specific member in a guild by member ID',
    tags: ['Members'],
    description: 'Fetches detailed information about a specific guild member using their user ID, including roles and activity statistics if available.',
    request: {
      params: z.object({
        guildId: z.string().openapi({
          description: 'Unique identifier of the guild.',
          example: '123456789012345678',
        }),
        memberId: z.string().openapi({
          description: 'Unique identifier of the guild member.',
          example: '987654321098765432',
        }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'Details of the specified guild member.',
        content: {
          'application/json': {
            schema: memberSchema.openapi({
              description: 'A guild member object with extended information.',
              example: {
                id: '987654321098765432',
                tag: 'User#1234',
                avatar: 'https://cdn.discordapp.com/avatars/987654321098765432/abcdef1234567890.png',
                roles: ['111111111111111111', '222222222222222222'],
                xp: 1500,
                level: 3,
                commandsSent: 50,
                messagesSent: 200,
                timeInVoice: 3600,
                lomUsername: 'UserInLOM',
                joinedAt: '2023-10-01T12:34:56.789Z',
              },
            }),
          },
        },
      },
      403: {
        description: 'Forbidden: User does not have permission to access this member.',
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
    const { isValid, message, status, guild } = await guildPermissionMiddleware(c);
    client.logger.info(`[API] Accessed the API for member ${memberId} in guild ${guild?.name} (${guildId})`);
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const target = guild.members.cache.get(memberId);
    if (!target) return c.json({ message: 'Member not found.' }, 404);

    const dbUser = await client.db.guildMember.findUnique({
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
        level: calculateLevelFromXP(dbUser?.xp ?? 0),
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

export default routes;
