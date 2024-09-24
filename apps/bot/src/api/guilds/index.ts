import { z } from '@hono/zod-openapi';
import { createFactory, getGuildsFromSessionTokens } from '~/api/lib/helpers';
import {
  errorSchema,
  guildPermissionMiddleware,
  guildSchema
} from '~/api/lib/schemas';
import { client } from '~/index';
import {
  AllFeaturesSchema,
  formatAllFeaturesAsObject,
  getAllGuildFeatures
} from '~/services/common';

import channelRoutes from './channels';
import emojiRoutes from './emojis';
import inviteRoutes from './invites';
import memberRoutes from './members';
import roleRoutes from './roles';
import settingRoutes from './settings';
import ticketRoutes from './tickets';

const routes = createFactory();

routes.openapi(
  {
    method: 'get',
    path: '',
    summary: 'Retrieve all guilds the user or bot is a member of',
    tags: ['Guilds'],
    description:
      'Retrieves a list of guilds that the authenticated user or bot is a member of. Provide an API key to get guilds the bot is in, or use a session token to get guilds the user is in.',
    security: [{ 'API Key': [] }],
    responses: {
      200: {
        description: 'A successful response containing the list of guilds.',
        content: {
          'application/json': {
            schema: z.array(
              guildSchema
                .omit({ settings: true, memberCount: true })
                .extend({
                  banner: z.string().nullable().openapi({
                    description: 'URL of the guild banner image.',
                    example: 'https://cdn.discordapp.com/banners/123456789012345678/abcdef.png',
                  }),
                  isOwner: z.boolean().openapi({
                    description: 'Indicates if the user is the owner of the guild.',
                    example: false,
                  }),
                  permissions: z.string().openapi({
                    description:
                      'Permissions the user has in the guild, represented as a bitfield string.',
                    example: '8',
                  }),
                  canManage: z.boolean().openapi({
                    description: 'Indicates if the user can manage the guild.',
                    example: false,
                  }),
                  hasBot: z.boolean().openapi({
                    description: 'Indicates if the bot is present in the guild.',
                    example: true,
                  }),
                }),
            ).openapi({
              description: 'A list of guild objects.',
              example: [
                {
                  id: '123456789012345678',
                  name: 'Example Guild',
                  icon: 'https://cdn.discordapp.com/icons/123456789012345678/abcdef.png',
                  banner: 'https://cdn.discordapp.com/banners/123456789012345678/abcdef.png',
                  isOwner: false,
                  permissions: '8',
                  canManage: false,
                  hasBot: true,
                },
              ],
            }),
          },
        },
      },
      403: {
        description: 'Forbidden: User does not have permission to access this resource.',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const { session, userId } = c.get('apiKey');
    if (session) {
      const guilds = await getGuildsFromSessionTokens(c);
      return c.json(guilds, 200);
    }

    if (!userId) {
      return c.json({ message: 'User not found.' }, 403);
    }

    const guilds = client.guilds.cache
      .filter((g) => g.members.cache.has(userId))
      .map((g) => {
        const me = g.members.cache.get(userId);

        return {
          id: g.id,
          name: g.name,
          icon: g.iconURL() ?? '',
          banner: g.bannerURL() ?? '',
          isOwner: g.ownerId === userId,
          permissions: me?.permissions.bitfield.toString() ?? '0',
          canManage: me?.permissions.has('ManageGuild') ?? false,
          hasBot: true,
        };
      }).sort((a, b) => {
        if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
        if (a.canManage !== b.canManage) return a.canManage ? -1 : 1;
        if (a.hasBot !== b.hasBot) return a.hasBot ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    return c.json(guilds, 200);
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/:guildId',
    summary: 'Retrieve detailed information about a specific guild by its ID',
    tags: ['Guilds'],
    description: 'Fetches detailed information about a specific guild using its unique identifier.',
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
        description: 'A successful response containing the guild details.',
        content: {
          'application/json': {
            schema: guildSchema.extend({
              banner: z.string().nullable().openapi({
                description: 'URL of the guild banner image.',
                example: 'https://cdn.discordapp.com/banners/123456789012345678/abcdef.png',
              }),
              isOwner: z.boolean().openapi({
                description: 'Indicates if the user is the owner of the guild.',
                example: false,
              }),
              permissions: z.string().openapi({
                description:
                  'Permissions the user has in the guild, represented as a bitfield string.',
                example: '8',
              }),
              canManage: z.boolean().openapi({
                description: 'Indicates if the user can manage the guild.',
                example: false,
              }),
              hasBot: z.boolean().openapi({
                description: 'Indicates if the bot is present in the guild.',
                example: true,
              }),
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
    const { isValid, message, status, guild, member } = await guildPermissionMiddleware(c);
    client.logger.info(
      `[API] ${
        member ? member.user.tag : 'Unknown'
      } (${member ? member.id : 'Unknown'}) accessed the API for ${guild?.name} (${guildId})`,
    );
    if (!isValid) return c.json({ message }, status as 403 | 404);

    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    const  guildSettings = await getAllGuildFeatures<{}>(guild.id);

    return c.json(
      {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.members.cache.filter((m) => !m.user.bot).size,
        settings: formatAllFeaturesAsObject(guildSettings) as unknown as z.infer<typeof AllFeaturesSchema>,
        canManage: member.permissions.has('ManageGuild'),
        hasBot: true,
        isOwner: guild.ownerId === member.id,
        permissions: member.permissions.bitfield.toString(),
        banner: guild.bannerURL(),
      },
      200,
    );
  },
);

routes.route('/', channelRoutes);
routes.route('/', emojiRoutes);
routes.route('/', inviteRoutes);
routes.route('/', memberRoutes);
routes.route('/', roleRoutes);
routes.route('/', settingRoutes);
routes.route('/', ticketRoutes);

export default routes;