import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DISCORD_TOKEN: z.string(),
    DISCORD_CLIENT_ID: z.string(),
    DISCORD_CLIENT_SECRET: z.string(),
    IS_DEVELOPMENT: z.boolean({ coerce: true }).default(false),
    DEVELOPMENT_GUILD_ID: z.string().optional(),
    PORT: z.number({ coerce: true }),
    BASE_URL: z.string(),
    DASHBOARD_URL: z.string(),
    SPOTIFY_CLIENT_ID: z.string(),
    SPOTIFY_CLIENT_SECRET: z.string(),
    BOT_GOOGLE_EMAIL: z.string(),
    BOT_GOOGLE_PASSWORD: z.string(),
  },
  runtimeEnv: process.env,
});
