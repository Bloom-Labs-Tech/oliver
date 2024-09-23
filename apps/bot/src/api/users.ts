import { z } from '@hono/zod-openapi';
import { createFactory } from '~/api/lib/helpers';

const routes = createFactory();

routes.openapi(
  {
    method: 'get',
    path: '/',
    description: 'Get all users in the database.',
    security: [{ 'API Key': [] }],
    tags: ['Users'],
    responses: {
      200: {
        description: 'The users were successfully retrieved.',
        content: {
          'application/json': {
            schema: z.array(
              z.object({
                id: z.string({ description: 'The ID of the member.' }).openapi({
                  description: 'The ID of the member.',
                  example: '1234567890',
                }),
                tag: z.string({ description: 'The tag of the member.' }).openapi({
                  description: 'The tag of the member.',
                  example: 'Oliver#0001',
                }),
                avatar: z
                  .string({ description: 'The avatar of the member.' })
                  .optional()
                  .openapi({
                    description: 'The avatar of the member.',
                    example: 'https://cdn.discordapp.com/avatars/1234567890/abcdef.jpg',
                  })
                  .nullable(),
                guilds: z.array(
                  z.string({ description: 'The ID of the guild.' }).openapi({
                    description: 'The ID of the guild.',
                    example: '1234567890',
                  }),
                ),
                lomUsername: z
                  .string({ description: 'The username of the member on Legend of Mushroom.' })
                  .openapi({
                    description: 'The username of the member on Legend of Mushroom.',
                    example: 'Oliver',
                  })
                  .nullable(),
              }),
            ),
          },
        },
      },
    },
  },
  async (c) => {
    const users = await client.db.user.findMany({
      select: {
        id: true,
        lomUsername: true,
        guilds: {
          select: {
            guildId: true,
          },
        },
      },
    });

    const cachedUsers = c.get('client')?.users.cache.filter((u) => !u.bot && users.some((user) => user.id === u.id));
    const data = users.map((user) => {
      const cachedUser = cachedUsers?.get(user.id);
      return {
        id: user.id,
        tag: cachedUser?.tag ?? 'Unknown#0000',
        avatar: cachedUser?.displayAvatarURL(),
        guilds: user.guilds.map((g) => g.guildId),
        lomUsername: user.lomUsername,
      };
    });

    return c.json(data, 200);
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/{id}',
    description: 'Get a user by their ID.',
    security: [{ 'API Key': [] }],
    tags: ['Users'],
    request: {
      params: z.object({
        id: z.string({ description: 'The ID of the user.' }).openapi({
          description: 'The ID of the user.',
          example: '1234567890',
        }),
      }),
    },
    responses: {
      200: {
        description: 'The user was successfully retrieved.',
        content: {
          'application/json': {
            schema: z.object({
              id: z.string({ description: 'The ID of the member.' }).openapi({
                description: 'The ID of the member.',
                example: '1234567890',
              }),
              tag: z.string({ description: 'The tag of the member.' }).openapi({
                description: 'The tag of the member.',
                example: 'Oliver#0001',
              }),
              avatar: z
                .string({ description: 'The avatar of the member.' })
                .optional()
                .openapi({
                  description: 'The avatar of the member.',
                  example: 'https://cdn.discordapp.com/avatars/1234567890/abcdef.jpg',
                })
                .nullable(),
              guilds: z.array(
                z.string({ description: 'The ID of the guild.' }).openapi({
                  description: 'The ID of the guild.',
                  example: '1234567890',
                }),
              ),
              lomUsername: z
                .string({ description: 'The username of the member on Legend of Mushroom.' })
                .openapi({
                  description: 'The username of the member on Legend of Mushroom.',
                  example: 'Oliver',
                })
                .nullable(),
              xp: z.number({ description: 'The total XP the user has.' }).openapi({
                description: 'The total XP the user has.',
                example: 123456,
              }),
              commandsSent: z.number({ description: 'The total commands the user has sent.' }).openapi({
                description: 'The total commands the user has sent.',
                example: 123456,
              }),
              messagesSent: z.number({ description: 'The total messages the user has sent.' }).openapi({
                description: 'The total messages the user has sent.',
                example: 123456,
              }),
              timeInVoice: z.number({ description: 'The total time the user has spent in voice channels.' }).openapi({
                description: 'The total time the user has spent in voice channels.',
                example: 123456,
              }),
            }),
          },
        },
      },
      404: {
        description: 'The user was not found.',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string({ description: 'The error message.' }).openapi({
                description: 'The error message.',
                example: 'User not found.',
              }),
            }),
          },
        },
      },
    },
  },
  async (c) => {
    const id = c.req.valid('param')?.id;
    const user = await client.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        lomUsername: true,
        guilds: {
          select: {
            guildId: true,
            xp: true,
            commandsSent: true,
            messagesSent: true,
            timeInVoice: true,
          },
        },
      },
    });

    if (!user) {
      return c.json({ message: 'User not found.' }, 404);
    }

    const cachedUser = c.get('client')?.users.cache.get(user.id);
    const data = {
      id: user.id,
      tag: cachedUser?.tag ?? 'Unknown#0000',
      avatar: cachedUser?.displayAvatarURL(),
      guilds: user.guilds.map((g) => g.guildId),
      lomUsername: user.lomUsername,
      xp: user.guilds.reduce((acc, g) => acc + g.xp, 0),
      commandsSent: user.guilds.reduce((acc, g) => acc + g.commandsSent, 0),
      messagesSent: user.guilds.reduce((acc, g) => acc + g.messagesSent, 0),
      timeInVoice: user.guilds.reduce((acc, g) => acc + g.timeInVoice, 0),
    };

    return c.json(data, 200);
  },
);

export default routes;
