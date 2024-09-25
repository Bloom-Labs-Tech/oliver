import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { env } from '~/env';
import { generateRandomString } from '~/utils/helpers';
import {
  createFactory,
  createSession,
  exchangeCode,
  generateOAuthLoginUrl,
  getSessionId,
  getUserInfo,
  handleSignout,
} from './lib/helpers';

const routes = createFactory();

routes.get('/login', async (c) => {
  const state = generateRandomString(24);
  setCookie(c, 'state', state, { maxAge: 300, httpOnly: true });
  return c.redirect(generateOAuthLoginUrl(state, "login"));
});

routes.get('/invite', async (c) => {
  const state = generateRandomString(24);
  setCookie(c, 'state', state, { maxAge: 300, httpOnly: true });
  return c.redirect(generateOAuthLoginUrl(state, "invite"));
});

routes.get('/callback', async (c) => {
  const client = c.get('client');
  const { code, state } = c.req.query();

  client.logger.info('OAuth2 code:', code);
  client.logger.info('OAuth2 state:', state);

  if (!code || !state) {
    client.logger.error('Missing code or state in OAuth2 callback');
    return c.redirect('/auth/login');
  }

  const savedState = getCookie(c, 'state');
  if (state !== savedState) {
    client.logger.error('OAuth2 state mismatch');
    return c.redirect('/auth/login');
  }

  try {
    const token = await exchangeCode(code);
    client.logger.info('OAuth2 access token:', token);

    const user = await getUserInfo(token.access_token);
    if (!user) {
      client.logger.error('Failed to fetch user info');
      return c.redirect('/auth/login');
    }

    const session = await createSession(c, user, token);
    setCookie(c, 'x-session-id', session.id, { maxAge: token.expires_in, httpOnly: true });
    deleteCookie(c, 'state');

    return c.redirect(env.DASHBOARD_URL);
  } catch (error) {
    client.logger.error('Error during OAuth2 token exchange', error);
    return c.redirect('/auth/login');
  }
});

routes.get('/session', async (c) => {
  const client = c.get('client');
  const sessionId = getSessionId(c);

  client.logger.info('Session ID:', sessionId);

  if (!sessionId) {
    return c.json({ success: false });
  }

  const session = await client.db.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (sessionId) {
      await client.db.session.delete({ where: { id: sessionId } });
    }
    return c.json({ success: false });
  }

  const user = await client.users.fetch(session.user.id);
  return c.json({
    success: true,
    session: {
      ...session,
      user: { ...session.user, username: user.username, image: user.displayAvatarURL() },
    },
  });
});

routes.get('/signout', handleSignout);
routes.post('/signout', handleSignout);

export default routes;
