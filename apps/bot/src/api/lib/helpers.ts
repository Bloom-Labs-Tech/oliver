import { OpenAPIHono } from '@hono/zod-openapi';
import type { PrismaClient } from '@prisma/client';
import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie } from 'hono/cookie';
import type { OliverBot } from '~/client';
import { env } from '~/env';
import { client } from '~/index';
import type { OliverError } from '~/utils/errors';

export type EnvVariables = {
  client: OliverBot;
  db: PrismaClient;
  apiKey: ApiKeyContext;
};

export type HonoContext = Context<{ Variables: EnvVariables }>;

type ApiKeyContext =
  | {
      key: string;
      id: string;
      uses: number;
      userId: string | null;
      lastUsed: Date | null;
      valid: true;
    }
  | {
      key: string;
      id: string | null;
      uses: number | null;
      userId: string | null;
      lastUsed: Date | null;
      valid: false;
    };

// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
type ApiKeyResponse = Response | void;
type ApiKeyConfig = {
  getKey?: (c: Context) => string | undefined;
  handleInvalidKey?: (c: Context) => Promise<ApiKeyResponse> | ApiKeyResponse;
  onError?: (c: Context, error: OliverError) => Promise<ApiKeyResponse> | ApiKeyResponse;
};
type ApiKeyFunction = (cfg?: ApiKeyConfig) => MiddlewareHandler;

const defaultConfig: ApiKeyConfig = {
  getKey: (c) => c.req.header('x-api-key') || c.req.header('x-session-id'),
  handleInvalidKey: (c) => c.json({ message: 'Invalid API key' }, 401),
  onError: (c, error) => c.json({ message: error.message }, 500),
};

const apiKeyRegex = /^(test|prod):[a-zA-Z0-9]{16}$/;
export const handleApiKey: ApiKeyFunction = (cfg) => async (c, next) => {
  const config = { ...defaultConfig, ...cfg } as ApiKeyConfig;
  const apiKey = config.getKey?.(c);
  if (!apiKey) {
    return config.handleInvalidKey?.(c);
  }
  if (apiKeyRegex.test(apiKey)) {
    const apiKeyData = await client.db.apiKey
      .update({
        where: { key: apiKey },
        data: { lastUsed: new Date(), uses: { increment: 1 } },
        select: { key: true, id: true, uses: true, userId: true, lastUsed: true },
      })
      .catch((error) => {
        config.onError?.(c, error);
        return null;
      });
    c.set('apiKey', {
      apiKey: apiKey || '',
      ...apiKeyData,
      valid: !!apiKeyData,
    });
    if (!apiKey || !apiKeyData) {
      return config.handleInvalidKey?.(c);
    }
  } else {
    const session = await client.db.session
      .findUnique({
        where: { id: apiKey },
        select: { id: true, expiresAt: true, user: { select: { id: true } } },
      })
      .catch((error) => {
        client.logger.error('Error fetching session', error);
        config.onError?.(c, error);
        return null;
      });

    if (!session || session.expiresAt < new Date()) {
      if (apiKey) {
        await client.db.session.deleteMany({ where: { id: apiKey } }).catch((_) => null);
      }
      return config.handleInvalidKey?.(c);
    }

    c.set('apiKey', {
      key: apiKey,
      id: session.id,
      uses: null,
      userId: session.user.id,
      lastUsed: null,
      valid: true,
    });
  }

  await next();
};

export const createFactory = () => {
  const app = new OpenAPIHono<{
    Variables: EnvVariables;
  }>();
  app.use(async (c, next) => {
    c.set('client', client);
    c.set('db', client.db);
    await next();
  });
  return app;
};

export function generateOAuthLoginUrl(state: string) {
  const scopes = ['identify', 'email'];

  const url = new URL('https://discord.com/api/oauth2/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', env.DISCORD_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${env.BASE_URL}/auth/callback`);
  url.searchParams.set('scope', scopes.join(' '));
  url.searchParams.set('state', state);

  return url.toString();
}

const API_ENDPOINT = 'https://discord.com/api/v10';
export async function exchangeCode(code: string): Promise<DiscordOAuth2AccessToken> {
  const data = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: `${env.BASE_URL}/auth/callback`,
  });

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(`${env.DISCORD_CLIENT_ID}:${env.DISCORD_CLIENT_SECRET}`).toString('base64')}`,
  };

  const response = await fetch(`${API_ENDPOINT}/oauth2/token`, {
    method: 'POST',
    headers: headers,
    body: data,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as DiscordOAuth2AccessToken;
}

export async function getUserInfo(accessToken: string): Promise<DiscordOAuth2UserInfo> {
  const response = await fetch(`${API_ENDPOINT}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as DiscordOAuth2UserInfo;
}

export async function refreshToken(refreshToken: string) {
  const data = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(`${env.DISCORD_CLIENT_ID}:${env.DISCORD_CLIENT_SECRET}`).toString('base64')}`,
  };

  const response = await fetch(`${API_ENDPOINT}/oauth2/token`, {
    method: 'POST',
    headers: headers,
    body: data,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as DiscordOAuth2AccessToken;
}

export async function revokeToken(token: string) {
  const data = new URLSearchParams({
    token: token,
  });

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(`${env.DISCORD_CLIENT_ID}:${env.DISCORD_CLIENT_SECRET}`).toString('base64')}`,
  };

  const response = await fetch(`${API_ENDPOINT}/oauth2/token/revoke`, {
    method: 'POST',
    headers: headers,
    body: data,
  }).catch(() => null);

  if (!response?.ok) {
    return false;
  }

  return true;
}

export const getSessionId = (c: HonoContext) => getCookie(c, 'x-session-id') || c.req.header('x-session-id');

export const createSession = async (c: HonoContext, user: DiscordOAuth2UserInfo, token: DiscordOAuth2AccessToken) => {
  const client = c.get('client');
  const session = await client.db.session.create({
    data: {
      user: {
        connectOrCreate: {
          where: { id: user.id },
          create: {
            id: user.id,
            email: user.email,
          },
        },
      },
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
    },
    select: { id: true, expiresAt: true },
  });

  return session;
};

export const handleSignout = async (c: HonoContext) => {
  const client = c.get('client');
  const sessionId = getSessionId(c);

  if (sessionId) {
    await client.db.session.delete({ where: { id: sessionId } });
    deleteCookie(c, 'x-session-id');
    await client.db.apiKey.deleteMany({ where: { key: sessionId } });
  }

  return c.json({ success: true });
};
