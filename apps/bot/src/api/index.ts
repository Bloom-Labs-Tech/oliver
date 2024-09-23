import { z } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { env } from '~/env';
import packageJson from '../../package.json';
import authRoutes from './auth';
import guildRoutes from './guilds';
import { createFactory, handleApiKey } from './lib/helpers';
import userRoutes from './users';

const routes = createFactory();

routes.openAPIRegistry.registerComponent('securitySchemes', 'API Key', {
  type: 'apiKey',
  name: 'x-api-key',
  in: 'header',
});

routes.use('/guilds/*', handleApiKey());
routes.use('/users/*', handleApiKey());

routes.route('/guilds', guildRoutes);
routes.route('/users', userRoutes);
routes.route('/auth', authRoutes);

routes.openapi(
  {
    method: 'get',
    path: '/',
    summary: 'API health check to ensure operational status.',
    tags: ['Home'],
    responses: {
      200: {
        description: 'The API is operational.',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string({ description: 'A friendly message from the API.' }).openapi({
                description: 'A friendly message from the API.',
                example: 'API is operational. <3 from fabra',
              }),
              version: z
                .string({ description: 'The version of the API.' })
                .openapi({ description: 'The version of the API.', example: '0.1.0' }),
            }),
          },
        },
      },
    },
  },
  (context) => {
    return context.json({ message: 'API is operational. <3 from fabra', version: packageJson.version });
  },
);

routes.doc('/openapi.json', {
  info: {
    title: 'OliverAPI',
    version: '0.1.0',
  },
  openapi: '3.0.0',
  tags: [
    {
      name: 'Home',
      description: 'API health check to ensure operational status.',
    },
    {
      name: 'Guilds',
      description: 'Guilds API.',
    },
  ],
  servers: [
    {
      url: env.BASE_URL,
      description: 'The API server.',
    },
  ],
});

routes.get(
  '/docs',
  apiReference({
    pageTitle: 'OliverBot API',
    theme: 'kepler',
    spec: {
      url: '/openapi.json',
    },
  }),
);

export default routes;
