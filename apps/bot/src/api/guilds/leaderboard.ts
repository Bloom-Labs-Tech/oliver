import { z } from '@hono/zod-openapi';
import { createFactory } from '~/api/lib/helpers';
import { client } from '~/index';
import { calculateLevelFromXP } from '~/services/levels';

const routes = createFactory();

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/leaderboard',
    summary: 'List the top members in a guild',
    tags: ['Leaderboard'],
    description: 'Retrieves a list of the top members within the specified guild, sorted by experience points (XP) in descending order.',
    request: {
      query: z.object({
        limit: z.number().optional().openapi({
          description: 'The maximum number of members to return.',
          example: 10,
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
        description: 'A list of the top members in the guild.',
        content: {
          "application/json": {
            schema: z.object({
              total: z.number().openapi({
                description: 'Total number of members retrieved.',
                example: 10,
              }),
              page: z.number().openapi({
                description: 'The current page number.',
                example: 1,
              }),
              limit: z.number().openapi({
                description: 'The maximum number of members per page.',
                example: 10,
              }),
              members: z.array(z.object({
                id: z.string().openapi({
                  description: 'Unique identifier of the member.',
                  example: '123456789012345678',
                }),
                rank: z.number().openapi({
                  description: 'The rank of the member in the leaderboard.',
                  example: 1,
                }),
                nickname: z.string().openapi({
                  description: 'Nickname of the member.',
                  example: 'John',
                }),
                tag: z.string().openapi({
                  description: 'Username of the member.',
                  example: 'JohnDoe',
                }),
                level: z.number().openapi({
                  description: 'The current level of the member.',
                  example: 10,
                }),
                xp: z.number().openapi({
                  description: 'The total experience points (XP) of the member.',
                  example: 1000,
                }),
                image: z.string().nullable().optional().openapi({
                  description: 'URL of the member avatar image, or `null` if none.',
                  example: 'https://cdn.discordapp.com/avatars/123456789012345678/abcdef.png',
                }),
              })),
            }),
          },
        },
      },
      404: {
        description: 'Guild not found.',
        content: {
          "application/json": {
            schema: z.object({
              message: z.string().openapi({
                description: 'Error message.',
                example: 'Guild not found.',
              }),
            }),
          },
        },
      },
    },
  },
  async (c) => {
    const { guildId } = c.req.valid("param");
    const { limit = 10, page = 1 } = c.req.valid("query");
    
    const members = await client.db.guildMember.findMany({
      where: { guildId },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { xp: 'desc' },
    });
    
    const total = await client.db.guildMember.count({ where: { guildId } });
    
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return c.json({ message: 'Guild not found' }, 404);

    const users = await Promise.all(members.map((m) => guild.members.fetch(m.userId)));
    const memberData = users.map((user) => {
      const member = members.find((m) => m.userId === user.id);
      if (!user || !member) return null;
      const level = calculateLevelFromXP(member.xp);
      return {
        id: member.userId,
        tag: user.user.username,
        rank: members.indexOf(member) + 1 + (page - 1) * limit,
        nickname: user.displayName ?? user.user.username,
        level,
        xp: member.xp,
        image: user.user.avatarURL() ?? null,
      };
    }).filter((m) => m !== null);
    
    return c.json({ total, page, limit, members: memberData }, 200);
  }
);

export default routes;