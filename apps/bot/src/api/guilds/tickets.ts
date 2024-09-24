import { z } from '@hono/zod-openapi';
import { createFactory } from '~/api/lib/helpers';
import {
  errorSchema,
  guildPermissionMiddleware,
  ticketSchema
} from '~/api/lib/schemas';
import { client } from '~/index';

const routes = createFactory();


routes.openapi(
  {
    method: 'get',
    path: '/:guildId/tickets',
    summary: 'Get the tickets in the guild by ID.',
    tags: ['Tickets'],
    request: {
      params: z.object({
        guildId: z.string({ description: 'The ID of the guild.' }),
      }),
      query: z.object({
        limit: z.number({ coerce: true }).optional().openapi({
          description: 'The maximum number of tickets to return.',
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
        description: 'The tickets in the guild by ID.',
        content: {
          'application/json': {
            schema: z.object({
              total: z.number().openapi({
                description: 'Total number of tickets retrieved.',
                example: 123,
              }),
              page: z.number().openapi({
                description: 'The current page number.',
                example: 1,
              }), 
              limit: z.number().openapi({
                description: 'The maximum number of tickets per page.',
                example: 25,
              }),
              tickets: z.array(
                ticketSchema.openapi({
                  description: 'A ticket object.',
                  example: {
                    id: '987654321098765432',
                    userId: '123456789012345678',
                    channelId: '876543210987654321',
                    createdAt: '2021-10-10T12:00:00.000Z',
                  },
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
    const { limit = 25, page = 1 } = c.req.valid('query');
    const { guildId } = c.req.valid('param');
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${member ? member.user.tag : 'Unknown'} (${member ? member.id : 'Unknown'}) accessed the API for ${
        guild?.name
      } (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const ticketsLimit = Math.min(Math.max(limit, 1), 100); // Min 1, Max 100
    const tickets = await client.db.ticket.findMany({ where: { guildId }, take: ticketsLimit, skip: (page - 1) * limit });
    const total = await client.db.ticket.count({ where: { guildId } });

    const mappedTickets = tickets.map((t) => ({
      id: t.id,
      userId: t.userId,
      channelId: t.channelId,
      createdAt: t.createdAt.toISOString(),
    }));

    return c.json(
      {
        total,
        page,
        limit: ticketsLimit,
        tickets: mappedTickets,
      },
      200,
    );
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/tickets/:ticketId',
    summary: 'Get the ticket by ID.',
    tags: ['Tickets'],
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

    const ticket = await client.db.ticket.findUnique({ where: { id: ticketId }, include: { logs: true } });

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