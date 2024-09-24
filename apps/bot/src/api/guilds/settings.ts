import { z } from '@hono/zod-openapi';
import { FeatureType } from '@prisma/client';
import { createFactory } from '~/api/lib/helpers';
import {
  errorSchema,
  guildPermissionMiddleware
} from '~/api/lib/schemas';
import { client } from '~/index';
import {
  updateGuildFeature
} from '~/services/common';

const routes = createFactory();


routes.openapi(
  {
    method: 'put',
    path: '/:guildId/settings/:feature',
    summary: 'Update the settings of the guild by ID.',
    tags: ['Settings'],
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


export default routes;