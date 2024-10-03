import { ChannelType as DBChannelType } from '@prisma/client';
import type { Guild, GuildMember } from 'discord.js';
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
  id: z.string().openapi({
    description: 'Unique identifier for the guild assigned by Discord.',
    example: '123456789012345678',
  }),
  name: z.string().openapi({
    description: 'Name of the guild as displayed in Discord.',
    example: 'My Awesome Guild',
  }),
  icon: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description: "URL of the guild's icon image, or `null` if none.",
      example: 'https://cdn.discordapp.com/icons/123456789012345678/abcdef.png',
    }),
  memberCount: z.number().openapi({
    description: 'Total number of non-bot members in the guild.',
    example: 150,
  }),
  settings: AllFeaturesSchema,
});

export const memberSchema = z.object({
  id: z.string().openapi({
    description: 'Unique identifier for the guild member assigned by Discord.',
    example: '234567890123456789',
  }),
  tag: z.string().openapi({
    description: 'Discord username and discriminator of the member (e.g., `Username#1234`).',
    example: 'Oliver#0001',
  }),
  avatar: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description: "URL to the member's avatar image, or `null` if none.",
      example: 'https://cdn.discordapp.com/avatars/234567890123456789/abcdef.png',
    }),
  roles: z.array(z.string()).openapi({
    description: 'Array of role IDs assigned to the member.',
    example: ['345678901234567890', '456789012345678901'],
  }),
  joinedAt: z
    .string()
    .nullable()
    .openapi({
      description: 'ISO 8601 timestamp of when the member joined the guild, or `null` if unavailable.',
      example: '2021-10-10T12:00:00.000Z',
    }),
  xp: z.number().openapi({
    description: 'Amount of experience points the member has earned.',
    example: 100,
  }),
  level: z.number().openapi({
    description: 'Level of the member based on experience points.',
    example: 5,
  }),
  commandsSent: z.number().openapi({
    description: 'Total number of commands sent by the member.',
    example: 50,
  }),
  messagesSent: z.number().openapi({
    description: 'Total number of messages sent by the member.',
    example: 100,
  }),
  timeInVoice: z.number().openapi({
    description: 'Total time spent in voice channels in seconds.',
    example: 3600,
  }),
  lomUsername: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description: 'Username of the member in the Legends of Mushroom game, or `null` if not set.',
      example: 'UserInLOM',
    }),
});

export const roleSchema = z.object({
  id: z.string().openapi({
    description: 'Unique identifier for the role assigned by Discord.',
    example: '345678901234567890',
  }),
  name: z.string().openapi({
    description: 'Name of the role as displayed in the guild.',
    example: 'Moderator',
  }),
  color: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description: 'Hexadecimal color code of the role, or `null` if default color.',
      example: '#FF5733',
    }),
  position: z.number().openapi({
    description: 'Position of the role in the guild’s role hierarchy (higher value means higher rank).',
    example: 5,
  }),
  permissions: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description: 'Stringified 53-bit integer representing the role permissions, or `null` if default.',
      example: '8n',
    }),
});

export const ticketSchema = z.object({
  id: z.string().openapi({
    description: 'Unique identifier for the ticket.',
    example: '456789012345678901',
  }),
  userId: z.string().openapi({
    description: 'ID of the user who created the ticket.',
    example: '234567890123456789',
  }),
  channelId: z.string().openapi({
    description: 'ID of the Discord channel associated with the ticket.',
    example: '567890123456789012',
  }),
  createdAt: z.string().openapi({
    description: 'ISO 8601 timestamp of when the ticket was created.',
    example: '2021-10-10T12:00:00.000Z',
  }),
});

export const inviteSchema = z.object({
  code: z.string().openapi({
    description: 'Unique invite code for the guild.',
    example: 'abc123XYZ',
  }),
  channelId: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description: 'ID of the channel associated with the invite, or `null` if not applicable.',
      example: '567890123456789012',
    }),
  uses: z.number().openapi({
    description: 'Number of times the invite has been used.',
    example: 5,
  }),
  maxUses: z.number().openapi({
    description: 'Maximum number of times the invite can be used.',
    example: 10,
  }),
  maxAge: z.number().openapi({
    description: 'Duration in seconds after which the invite expires.',
    example: 3600,
  }),
  temporary: z.boolean().openapi({
    description: 'Indicates if the invite grants temporary membership.',
    example: false,
  }),
  createdAt: z
    .string()
    .nullable()
    .openapi({
      description: 'ISO 8601 timestamp of when the invite was created, or `null` if unavailable.',
      example: '2021-10-10T12:00:00.000Z',
    }),
});

export const errorSchema = z.object({
  message: z.string().openapi({
    description: 'Error message returned by the API.',
    example: 'An unexpected error occurred.',
  }),
});

export const channelSchema = z.object({
  id: z.string().openapi({
    description: 'Unique identifier for the channel.',
    example: '567890123456789012',
  }),
  name: z.string().openapi({
    description: 'Name of the channel as displayed in Discord.',
    example: 'general-chat',
  }),
  type: z
    .nativeEnum(DBChannelType)
    .nullable()
    .optional()
    .openapi({
      description: 'Type of the channel (e.g., TEXT, VOICE).',
      example: 'TEXT',
    }),
  parentId: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description: 'ID of the parent category channel, or `null` if none.',
      example: '678901234567890123',
    }),
});

export const emojiSchema = z.object({
  id: z.string().openapi({
    description: 'Unique identifier for the custom emoji.',
    example: '678901234567890123',
  }),
  name: z
    .string()
    .nullable()
    .openapi({
      description: 'Name of the emoji as set in the guild, or `null` if not applicable.',
      example: 'party_parrot',
    }),
  url: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description: 'URL to the emoji image.',
      example: 'https://cdn.discordapp.com/emojis/678901234567890123.png',
    }),
  animated: z.boolean().openapi({
    description: 'Indicates if the emoji is animated.',
    example: true,
  }),
});
