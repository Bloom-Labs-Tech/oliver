import { ChannelType as DBChannelType } from '@prisma/client';
import { type Guild, type GuildMember } from 'discord.js';
import type { Context } from 'hono';
import { z } from 'zod';
import { AllFeaturesSchema } from '~/services/common';
import type { EnvVariables } from './helpers';

type GuildPermissionMiddlewareResponse =
  | {
      isValid: true;
      message: null;
      status: number;
      guild: Guild;
      member: GuildMember;
    }
  | {
      isValid: false;
      message: string;
      status: number;
      guild: Guild | null;
      member: GuildMember | null;
    };

// Middleware for handling common checks
export const guildPermissionMiddleware = async (
  c: Context<{ Variables: EnvVariables }>,
): Promise<GuildPermissionMiddlewareResponse> => {
  const guildId = c.req.param('guildId') as string;
  const client = c.get('client');
  const userId = c.get('apiKey')?.userId;

  const guild = client.guilds.cache.get(guildId);

  if (!guild)
    return {
      isValid: false,
      message: 'Guild not found.',
      status: 404,
      guild: null,
      member: null,
    };

  if (!userId)
    return {
      isValid: false,
      message: 'User not found.',
      status: 401,
      guild,
      member: null,
    };

  const member = guild.members.cache.get(userId);
  if (!member)
    return {
      isValid: false,
      message: 'Member not found.',
      status: 401,
      guild,
      member: null,
    };

  if (!member?.permissions.has('ManageGuild') || !member?.permissions.has('Administrator'))
    return {
      isValid: false,
      message: 'User does not have permission.',
      status: 403,
      guild,
      member,
    };

  return { isValid: true, guild, member, status: 200, message: null };
};

// Constants for schemas
export const guildSchema = z.object({
  id: z.string({ description: 'The ID of the guild.' }).openapi({
    description: 'The unique identifier for the guild.',
    example: '1234567890',
  }),
  name: z.string({ description: 'The name of the guild.' }).openapi({
    description: 'The display name of the guild.',
    example: 'My Guild',
  }),
  icon: z
    .string({ description: 'The icon of the guild.' })
    .optional()
    .openapi({
      description: "URL of the guild's icon, if available.",
      example: 'https://cdn.discordapp.com/icons/1234567890/abcdef.jpg',
    })
    .nullable(),
  memberCount: z.number({ description: 'The number of members in the guild.' }).openapi({
    description: 'The total count of non-bot members in the guild.',
    example: 100,
  }),
  settings: AllFeaturesSchema,
});

export const memberSchema = z.object({
  id: z.string({ description: 'The ID of the member.' }).openapi({
    description: 'The unique identifier for the guild member.',
    example: '1234567890',
  }),
  tag: z.string({ description: 'The tag of the member.' }).openapi({
    description: 'The Discord tag of the member.',
    example: 'Oliver#0001',
  }),
  avatar: z
    .string({ description: 'The avatar of the member.' })
    .optional()
    .openapi({
      description: "URL to the member's avatar image, if available.",
      example: 'https://cdn.discordapp.com/avatars/1234567890/abcdef.jpg',
    })
    .nullable(),
  roles: z.array(z.string({ description: 'The roles of the member.' })),
  joinedAt: z
    .string({ description: 'The date the member joined the guild.' })
    .openapi({
      description: 'ISO date string representing when the member joined the guild.',
      example: '2021-10-10T12:00:00.000Z',
    })
    .nullable(),
});

export const roleSchema = z.object({
  id: z.string({ description: 'The ID of the role.' }).openapi({
    description: 'The unique identifier for the role.',
    example: '1234567890',
  }),
  name: z.string({ description: 'The name of the role.' }).openapi({
    description: 'The name of the role in the guild.',
    example: 'Admin',
  }),
  color: z
    .string({ description: 'The color of the role.' })
    .optional()
    .openapi({
      description: 'Hexadecimal color code representing the role color.',
      example: '#ff0000',
    })
    .nullable(),
  position: z.number({ description: 'The position of the role.' }).openapi({
    description: 'The position of the role in the role hierarchy.',
    example: 1,
  }),
});

export const ticketSchema = z.object({
  id: z.string({ description: 'The ID of the ticket.' }).openapi({
    description: 'The unique identifier for the ticket.',
    example: '1234567890',
  }),
  userId: z.string({ description: 'The ID of the user who created the ticket.' }).openapi({
    description: 'The unique identifier for the user who created the ticket.',
    example: '1234567890',
  }),
  channelId: z.string({ description: 'The ID of the channel where the ticket is handled.' }).openapi({
    description: 'The unique identifier of the Discord channel where the ticket was created.',
    example: '1234567890',
  }),
  createdAt: z
    .string({ description: 'The date the ticket was created.' })
    .openapi({
      description: 'ISO date string representing when the ticket was created.',
      example: '2021-10-10T12:00:00.000Z',
    })
    .nullable(),
});

export const inviteSchema = z.object({
  code: z.string({ description: 'The code of the invite.' }).openapi({
    description: 'The invite code for the guild.',
    example: 'abc123',
  }),
  channelId: z.string({ description: 'The ID of the channel associated with the invite.' }).optional().nullable(),
  uses: z.number({ description: 'The number of times the invite has been used.' }).openapi({
    description: 'How many times the invite has been used.',
    example: 1,
  }),
  maxUses: z.number({ description: 'The maximum number of uses allowed for the invite.' }).openapi({
    description: 'The maximum number of times this invite can be used.',
    example: 10,
  }),
  maxAge: z.number({ description: 'The maximum age of the invite in seconds.' }).openapi({
    description: 'Time in seconds before the invite expires.',
    example: 86400,
  }),
  temporary: z.boolean({ description: 'Whether the invite grants temporary membership.' }).openapi({
    description: 'If true, the invite grants temporary membership to the guild.',
    example: false,
  }),
  createdAt: z
    .string({ description: 'The date the invite was created.' })
    .openapi({
      description: 'ISO date string representing when the invite was created.',
      example: '2021-10-10T12:00:00.000Z',
    })
    .nullable(),
});

export const errorSchema = z.object({
  message: z.string({ description: 'The error message.' }).openapi({
    description: 'The error message returned by the API.',
    example: 'User does not have permission.',
  }),
});

export const channelSchema = z.object({
  id: z.string({ description: 'The ID of the channel.' }).openapi({
    description: 'The ID of the channel.',
    example: '1234567890',
  }),
  name: z.string({ description: 'The name of the channel.' }).openapi({
    description: 'The name of the channel.',
    example: 'general',
  }),
  type: z.nativeEnum(DBChannelType).optional().nullable(),
  parentId: z.string({ description: 'The ID of the parent channel.' }).optional().nullable(),
});

export const emojiSchema = z.object({
  id: z.string({ description: 'The ID of the emoji.' }).openapi({
    description: 'The ID of the emoji.',
    example: '1234567890',
  }),
  name: z
    .string({ description: 'The name of the emoji.' })
    .openapi({
      description: 'The name of the emoji.',
      example: 'emoji',
    })
    .nullable(),
  url: z.string({ description: 'The URL of the emoji.' }).optional().openapi({
    description: 'The URL of the emoji.',
    example: 'https://cdn.discordapp.com/emojis/1234567890.png',
  }),
  animated: z.boolean({ description: 'Whether the emoji is animated.' }).openapi({
    description: 'Whether the emoji is animated.',
    example: false,
  }),
});
