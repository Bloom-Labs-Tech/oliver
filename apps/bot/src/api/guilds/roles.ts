import { z } from '@hono/zod-openapi';
import type { ColorResolvable } from 'discord.js';
import { createFactory, parseBigInt } from '~/api/lib/helpers';
import {
  errorSchema,
  guildPermissionMiddleware,
  roleSchema
} from '~/api/lib/schemas';
import { client } from '~/index';

const routes = createFactory();

routes.openapi(
  {
    method: 'get',
    path: '/:guildId/roles',
    summary: 'List all roles in a guild',
    tags: ['Roles'],
    description: 'Retrieves a list of all roles within the specified guild, including their IDs, names, colors, and positions in the role hierarchy.',
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
        description: 'A list of roles in the guild.',
        content: {
          'application/json': {
            schema: z.array(
              roleSchema.openapi({
                description: 'A role object.',
                example: {
                  id: '876543210987654321',
                  name: 'Moderator',
                  color: '#FF5733',
                  position: 5,
                },
              }),
            ),
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
    const { isValid, message, status, guild } = await guildPermissionMiddleware(c);
    client.logger.info(`[API] Accessed the API for ${guild?.name} (${guildId})`);
    if (!isValid) return c.json({ message }, status as 403 | 404);

    const roles = guild.roles.cache
      .filter((r) => r.id !== guild.id)
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        position: r.position,
        permissions: r.permissions.bitfield.toString(),
      })).sort((a, b) => {
        if (a.position !== b.position) return b.position - a.position;
        return a.name.localeCompare(b.name);
      });

    return c.json(roles, 200);
  },
);


routes.openapi(
  {
    method: 'post',
    path: '/:guildId/roles',
    summary: 'Create a new role in a guild',
    tags: ['Roles'],
    description: 'Creates a new role within the specified guild with the given properties such as name, color, and position in the role hierarchy.',
    request: {
      params: z.object({
        guildId: z.string().openapi({
          description: 'Unique identifier of the guild.',
          example: '123456789012345678',
        }),
      }),
      body: {
        content: {
          'application/json': {
            schema: roleSchema.openapi({
              description: 'A role object.',
              example: {
                id: '876543210987654321',
                name: 'Moderator',
                color: '#FF5733',
                position: 5,
                permissions: '8',
              },
            }),
          },
        },
      },
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'Details of the newly created role.',
        content: {
          'application/json': {
            schema: roleSchema.openapi({
              description: 'A role object.',
              example: {
                id: '876543210987654321',
                name: 'Moderator',
                color: '#FF5733',
                position: 5,
                permissions: '8',
              },
            }),
          },
        },
      },
      403: {
        description: 'Forbidden: User does not have permission to create roles in this guild.',
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
        description: 'Internal Server Error: Error occurred while creating the role.',
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
      client.logger.debug(`Creating role ${body.name} in guild ${guild.name}.`, parseBigInt(body.permissions));
      const role = await guild.roles.create({
        name: body.name,
        color: (body.color as ColorResolvable) ?? undefined,
        position: body.position ?? undefined,
        permissions: parseBigInt(body.permissions),
      });

      await client.db.role.create({
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
          permissions: role.permissions.bitfield.toString(),
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
    method: 'get',
    path: '/:guildId/roles/:roleId',
    summary: 'Retrieve a specific role in a guild by role ID',
    tags: ['Roles'],
    description: 'Fetches details of a specific role within the specified guild using the role\'s ID.',
    request: {
      params: z.object({
        guildId: z.string().openapi({
          description: 'Unique identifier of the guild.',
          example: '123456789012345678',
        }),
        roleId: z.string().openapi({
          description: 'Unique identifier of the role.',
          example: '876543210987654321',
        }),
      }),
    },
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'Details of the requested role.',
        content: {
          'application/json': {
            schema: roleSchema.openapi({
              description: 'A role object.',
              example: {
                id: '876543210987654321',
                name: 'Moderator',
                color: '#FF5733',
                position: 5,
                permissions: '8',
              },
            }),
          },
        },
      },
      403: {
        description: 'Forbidden: User does not have permission to access this role.',
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
        permissions: role.permissions.bitfield.toString(),
      },
      200,
    );
  },
);

export default routes;