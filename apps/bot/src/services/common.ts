import { FeatureType } from '@prisma/client';
import { z } from 'zod';
import { client } from '..';

export const FeatureData = {
  COMMANDS: z.object({
    about: z.boolean(),
    cooldown: z.boolean(),
    help: z.boolean(),
    leaderboard: z.boolean(),
    level: z.boolean(),
    ping: z.boolean(),
    purge: z.boolean(),
    reload: z.boolean(),
    ticket: z.boolean(),
    verify: z.boolean(),
  }),
  INVITES: z.object({}),
  TICKETS: z.object({
    categoryId: z.string(),
  }),
  LEVELING: z.object({
    channelId: z.string(),
    roles: z.array(z.object({ level: z.number(), id: z.string() })),
  }),
  VOICE: z.object({
    categoryId: z.string(),
    channelId: z.string(),
  }),
  WELCOME: z.object({
    channelId: z.string(),
  }),
  GOODBYE: z.object({
    channelId: z.string(),
  }),
  AUTOROLE: z.object({
    roles: z.array(z.string()),
  }),
  LEGENDOFMUSHROOM: z.object({
    verification: z.object({
      isEnabled: z.boolean(),
      categoryId: z.string(),
      roles: z.array(z.string()),
    }),
  }),
  ANNOUNCEMENTS: z.object({
    channelId: z.string(),
  }),
  SUGGESTIONS: z.object({
    channelId: z.string(),
  }),
  MODERATION: z.object({
    channelId: z.string(),
  }),
  CUSTOM_COMMANDS: z.object({
    commands: z.array(z.object({
      name: z.string(),
      response: z.string(),
    })),
  }),
  ECONOMY: z.object({}),
  EVENTS: z.object({
    channelId: z.string(),
    events: z.array(z.object({
      name: z.string(),
      description: z.string(),
      date: z.string(),
    })),
  }),
  GIVEAWAYS: z.object({
    channelId: z.string(),
  }),
  LOGS: z.object({
    channelId: z.string(),
  }),
  REACTION_ROLES: z.object({
    roles: z.array(z.object({
      emoji: z.string(),
      roleId: z.string(),
    })),
  }),
  REMINDERS: z.object({
    channelId: z.string(),
    reminders: z.array(z.object({
      name: z.string(),
      description: z.string(),
      date: z.string(),
    })),
  }),
};

// Type definitions for feature schemas
export type FeatureDataTypeMap = {
  [FeatureType.COMMANDS]: typeof FeatureData.COMMANDS;
  [FeatureType.INVITES]: typeof FeatureData.INVITES;
  [FeatureType.TICKETS]: typeof FeatureData.TICKETS;
  [FeatureType.LEVELING]: typeof FeatureData.LEVELING;
  [FeatureType.VOICE]: typeof FeatureData.VOICE;
  [FeatureType.WELCOME]: typeof FeatureData.WELCOME;
  [FeatureType.GOODBYE]: typeof FeatureData.GOODBYE;
  [FeatureType.AUTOROLE]: typeof FeatureData.AUTOROLE;
  [FeatureType.LEGENDOFMUSHROOM]: typeof FeatureData.LEGENDOFMUSHROOM;
  [FeatureType.ANNOUNCEMENTS]: typeof FeatureData.ANNOUNCEMENTS;
  [FeatureType.SUGGESTIONS]: typeof FeatureData.SUGGESTIONS;
  [FeatureType.MODERATION]: typeof FeatureData.MODERATION;
  [FeatureType.CUSTOM_COMMANDS]: typeof FeatureData.CUSTOM_COMMANDS;
  [FeatureType.ECONOMY]: typeof FeatureData.ECONOMY;
  [FeatureType.EVENTS]: typeof FeatureData.EVENTS;
  [FeatureType.GIVEAWAYS]: typeof FeatureData.GIVEAWAYS;
  [FeatureType.LOGS]: typeof FeatureData.LOGS;
  [FeatureType.REACTION_ROLES]: typeof FeatureData.REACTION_ROLES;
  [FeatureType.REMINDERS]: typeof FeatureData.REMINDERS;
};

// Helper to create the schema with common structure
export const FormatCommandSchema = (type: FeatureType) => z.object({
  isEnabled: z.boolean(),
  data: FeatureData[type],
});

// Full schema for all features
export const AllFeaturesSchema = z.object(
  Object.fromEntries(
    Object.keys(FeatureData).map((key) => [
      key,
      FormatCommandSchema(key as FeatureType),
    ])
  )
);

// Default feature data
export const DefaultFeatureData: Record<keyof typeof FeatureType, z.infer<FeatureDataTypeMap[FeatureType]>> = {
  [FeatureType.COMMANDS]: {
    about: true,
    cooldown: true,
    help: true,
    leaderboard: true,
    level: true,
    ping: true,
    purge: true,
    reload: true,
    ticket: true,
    verify: true,
  },
  [FeatureType.INVITES]: {},
  [FeatureType.TICKETS]: {
    categoryId: '',
  },
  [FeatureType.LEGENDOFMUSHROOM]: {
    verification: {
      isEnabled: false,
      categoryId: '',
      roles: [],
    },
  },
  [FeatureType.LEVELING]: {
    channelId: '',
    roles: [],
  },
  [FeatureType.VOICE]: {
    categoryId: '',
    channelId: '',
  },
  [FeatureType.WELCOME]: {
    channelId: '',
  },
  [FeatureType.GOODBYE]: {
    channelId: '',
  },
  [FeatureType.AUTOROLE]: {
    roles: [],
  },
  [FeatureType.ANNOUNCEMENTS]: {
    channelId: '',
  },
  [FeatureType.SUGGESTIONS]: {
    channelId: '',
  },
  [FeatureType.MODERATION]: {
    channelId: '',
  },
  [FeatureType.CUSTOM_COMMANDS]: {
    commands: [],
  },
  [FeatureType.ECONOMY]: {},
  [FeatureType.EVENTS]: {
    channelId: '',
    events: [],
  },
  [FeatureType.GIVEAWAYS]: {
    channelId: '',
  },
  [FeatureType.LOGS]: {
    channelId: '',
  },
  [FeatureType.REACTION_ROLES]: {
    roles: [],
  },
  [FeatureType.REMINDERS]: {
    channelId: '',
    reminders: [],
  },
};
// Parse feature data with validation
const parseFeatureTypeData = <T extends FeatureType>(providedData: unknown, type: T) => {
  const schema = FeatureData[type];
  if (!providedData || Object.keys(providedData).length === 0) {
    return { success: true, data: null };
  }
  return schema.safeParse(providedData);
};

export type ParsedGuildFeature<T extends FeatureType, R extends boolean> = {
  data: R extends true ? z.infer<FeatureDataTypeMap[T]> : z.infer<FeatureDataTypeMap[T]> | null;
  isEnabled: boolean;
  guildId: string;
  type: T;
};

// Fetch or initialize a guild feature
export async function getGuildFeature<T extends FeatureType, R extends boolean = false>(
  guildId: string,
  type: T,
  required?: R
): Promise<ParsedGuildFeature<T, R> | null> {
  const feature = await client.db.guildFeature
    .upsert({
      where: { type_guildId: { guildId, type } },
      update: {},
      create: {
        guildId,
        type,
        isEnabled: false,
        data: DefaultFeatureData[type],
      },
    })
    .catch(() => null);

  if (!feature) return null;

  const parsedFeature = parseFeatureTypeData(feature.data, type);
  if (!parsedFeature.success || (required && !parsedFeature.data)) return null;

  return {
    ...feature,
    data: parsedFeature.data as z.infer<FeatureDataTypeMap[T]>,
  } as ParsedGuildFeature<T, R>;
}

// Fetch all guild features and create missing ones
export async function getAllGuildFeatures<D = null>(guildId: string) {
  const features = await client.db.guildFeature.findMany({ where: { guildId } });

  const missingFeatures = Object.keys(FeatureData).filter(
    (type) => !features.some((feature) => feature.type === type)
  ) as FeatureType[];

  if (missingFeatures.length) {
    await createMissingFeatures(guildId, missingFeatures);
  }

  return features.map((feature) => {
    const parsedFeature = parseFeatureTypeData(feature.data, feature.type);
    return {
      ...feature,
      data: parsedFeature.data as z.infer<FeatureDataTypeMap[typeof feature.type]>,
    };
  });
}

// Create missing features in the database
async function createMissingFeatures(guildId: string, missingFeatures: FeatureType[]) {
  await client.db.guildFeature.createMany({
    data: missingFeatures.map((type) => ({
      guildId,
      type,
      isEnabled: false,
      data: DefaultFeatureData[type],
    })),
  });
}

// Utility to format all features as an object
export const formatAllFeaturesAsObject = (
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
features: Awaited<ReturnType<typeof getAllGuildFeatures<{}>>>
) => {
  return features.reduce((acc, feature) => {
    acc[feature.type] = {
      data: feature.data,
      isEnabled: feature.isEnabled,
    };
    return acc;
  }, {} as Record<FeatureType, { data: z.infer<FeatureDataTypeMap[FeatureType]>; isEnabled: boolean }>);
};

// Update guild feature data
export async function updateGuildFeature<T extends FeatureType>(
  guildId: string,
  type: T,
  { data, isEnabled }: { isEnabled: boolean; data?: z.infer<FeatureDataTypeMap[T]> }
) {
  const validation = FeatureData[type].safeParse(data);
  if (!validation.success) return null;

  return client.db.guildFeature.upsert({
    where: { type_guildId: { guildId, type } },
    update: { isEnabled, data: validation.data },
    create: { guildId, type, data: validation.data, isEnabled },
  });
}

export type TicketNameType = `ticket-${string}` | `verify-${string}`;
export type TicketActionsType =
  | 'create-ticket'
  | `close-ticket-${string}`
  | `delete-ticket-${string}`
  | `claim-verification-${string}`
  | `verify-user-${string}`
  | `reject-user-${string}`;

export const TicketActions = {
  Create: 'create-ticket',
  Close: 'close-ticket',
  Delete: 'delete-ticket',
};

export const VerificationActions = {
  Verify: 'verify',
  ClaimVerification: 'claim-verification',
  VerifyUser: 'verify-user',
  RejectUser: 'reject-user',
};

export function isTicketName(name: string): name is TicketNameType {
  return name.startsWith('ticket-') || name.startsWith('verify-');
}

export function isTicketAction(name: string): name is TicketActionsType {
  return (
    name.startsWith('close-ticket-') ||
    name.startsWith('delete-ticket-') ||
    name.startsWith('claim-verification-') ||
    name.startsWith('verify-user-') ||
    name.startsWith('reject-user-') ||
    name === TicketActions.Create ||
    name === VerificationActions.Verify
  );
}
