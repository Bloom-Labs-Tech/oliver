import { FeatureType, type GuildFeature } from '@prisma/client';
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
  VERIFICATION: z.object({
    categoryId: z.string(),
    roles: z.array(z.string()),
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
};

export type FeatureDataTypeMap = {
  [FeatureType.COMMANDS]: typeof FeatureData.COMMANDS;
  [FeatureType.INVITES]: typeof FeatureData.INVITES;
  [FeatureType.TICKETS]: typeof FeatureData.TICKETS;
  [FeatureType.VERIFICATION]: typeof FeatureData.VERIFICATION;
  [FeatureType.LEVELING]: typeof FeatureData.LEVELING;
  [FeatureType.VOICE]: typeof FeatureData.VOICE;
  [FeatureType.WELCOME]: typeof FeatureData.WELCOME;
  [FeatureType.GOODBYE]: typeof FeatureData.GOODBYE;
  [FeatureType.AUTOROLE]: typeof FeatureData.AUTOROLE;
};

export const FormatCommandSchema = (type: FeatureType) => {
  const schema = FeatureData[type];
  return z.object({
    isEnabled: z.boolean(),
    data: schema,
  });
};

export const AllFeaturesSchema = z.object({
  COMMANDS: FormatCommandSchema(FeatureType.COMMANDS),
  INVITES: FormatCommandSchema(FeatureType.INVITES),
  TICKETS: FormatCommandSchema(FeatureType.TICKETS),
  VERIFICATION: FormatCommandSchema(FeatureType.VERIFICATION),
  LEVELING: FormatCommandSchema(FeatureType.LEVELING),
  VOICE: FormatCommandSchema(FeatureType.VOICE),
  WELCOME: FormatCommandSchema(FeatureType.WELCOME),
  GOODBYE: FormatCommandSchema(FeatureType.GOODBYE),
  AUTOROLE: FormatCommandSchema(FeatureType.AUTOROLE),
});

export const DefaultFeatureData: Record<FeatureType, z.infer<FeatureDataTypeMap[FeatureType]>> = {
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
  [FeatureType.VERIFICATION]: {
    categoryId: '',
    roles: [],
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
};

const parseFeatureTypeData = <T extends FeatureType>(providedData: GuildFeature['data'], type: T) => {
  const featureSchema = FeatureData[type] as z.AnyZodObject;
  if (Object.keys(JSON.parse(JSON.stringify(providedData))).length === 0) return { success: true, data: null };
  const parsed = featureSchema.safeParse(providedData);
  return parsed;
};

export type ParsedGuildFeature<T extends FeatureType, R extends boolean> = (R extends true
  ? { data: z.infer<FeatureDataTypeMap[T]> }
  : { data: z.infer<FeatureDataTypeMap[T]> | null }) &
  Omit<GuildFeature, 'data'>;

export async function getGuildFeature<T extends FeatureType, R extends boolean = false>(
  guildId: string,
  type: T,
  required?: R,
): Promise<ParsedGuildFeature<T, R> | null> {
  const feature = await client.db.guildFeature
    .upsert({
      where: {
        type_guildId: {
          guildId,
          type,
        },
      },
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

  if (!parsedFeature.success) return null;
  if (!parsedFeature.data && required) return null;

  return {
    ...feature,
    data: parsedFeature.data as z.infer<FeatureDataTypeMap[T]>,
  };
}

export async function getAllGuildFeatures<D = null>(
  guildId: string,
): Promise<
  {
    data: z.infer<FeatureDataTypeMap[FeatureType]> | D;
    type: FeatureType;
    isEnabled: boolean;
    guildId: string;
  }[]
> {
  const features = await client.db.guildFeature.findMany({ where: { guildId } });

  const missingFeatures = Object.values(FeatureType).filter(
    (type) => !features.some((feature) => feature.type === type),
  );
  if (missingFeatures.length) {
    await client.db.guildFeature
      .createMany({
        data: missingFeatures.map((type) => ({
          guildId,
          type,
          isEnabled: false,
          data: DefaultFeatureData[type],
        })),
      })
      .then(() => {
        features.push(
          ...missingFeatures.map((type) => ({
            guildId,
            type,
            isEnabled: false,
            data: DefaultFeatureData[type],
          })),
        );
      });
  }

  const parsedFeatures = features.map((feature) => {
    const parsedFeature = parseFeatureTypeData(feature.data, feature.type);
    return {
      ...feature,
      data: parsedFeature.data as z.infer<FeatureDataTypeMap[typeof feature.type]>,
    };
  });

  return parsedFeatures;
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export const formatAllFeaturesAsObject = (features: Awaited<ReturnType<typeof getAllGuildFeatures<{}>>>) => {
  return features.reduce(
    (acc, feature) => {
      acc[feature.type] = {
        data: feature.data,
        isEnabled: feature.isEnabled,
      };
      return acc;
    },
    {} as Record<FeatureType, { data: z.infer<FeatureDataTypeMap[FeatureType]>; isEnabled: boolean }>,
  );
};

export async function updateGuildFeature<T extends FeatureType>(
  guildId: string,
  type: T,
  { data, isEnabled }: { isEnabled: boolean; data?: z.infer<FeatureDataTypeMap[T]> },
) {
  const validation = FeatureData[type].safeParse(data);
  if (!validation.success) return null;

  const feature = await client.db.guildFeature.upsert({
    where: {
      type_guildId: {
        guildId,
        type,
      },
    },
    update: {
      isEnabled,
      data: validation.data,
    },
    create: {
      guildId,
      type,
      data: validation.data,
      isEnabled,
    },
  });

  return feature;
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
