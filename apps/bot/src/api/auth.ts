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
  await handleSignout(c);
  const returnTo = c.req.query('callback');
  const state = generateRandomString(24);
  setCookie(c, 'state', state, { maxAge: 300, httpOnly: true });
  if (returnTo) {
    setCookie(c, 'returnTo', returnTo, { maxAge: 300, httpOnly: true });
  }
  return c.redirect(generateOAuthLoginUrl(state, "login"));
});

routes.get('/invite', async (c) => {
  await handleSignout(c);
  const guildId = c.req.query('guildId');
  const state = generateRandomString(24);
  setCookie(c, 'state', state, { maxAge: 300, httpOnly: true });
  setCookie(c, 'returnTo', `/g/${guildId}`, { maxAge: 300, httpOnly: true });
  return c.redirect(generateOAuthLoginUrl(state, "invite", guildId));
});

routes.get('/callback', async (c) => {
  const client = c.get('client');
  const { code, state } = c.req.query();

  if (!code || !state) {
    return c.redirect('/auth/login');
  }

  const savedState = getCookie(c, 'state');
  if (state !== savedState) {
    return c.redirect('/auth/login');
  }
  
  try {
    const token = await exchangeCode(code);

    const user = await getUserInfo(token.access_token);
    if (!user) {
      return c.redirect('/auth/login');
    }
    
    const session = await createSession(c, user, token);
    setCookie(c, 'x-session', JSON.stringify(session), { maxAge: token.expires_in, httpOnly: true });
    client.logger.info(`User ${user.id} logged in`);
    deleteCookie(c, 'state');
    
    const returnTo = getCookie(c, 'returnTo');
    const url = new URL(returnTo ?? '', env.DASHBOARD_URL);
    deleteCookie(c, 'returnTo');

    client.logger.info(`Redirecting user to ${url.toString()}`, getCookie(c, 'x-session'));

    return c.redirect(url.toString());
  } catch (error) {
    client.logger.error('Error during OAuth2 token exchange', error);
    return c.redirect('/auth/login');
  }
});

routes.get('/session', async (c) => {
  const client = c.get('client');
  const sessionId = getSessionId(c);

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
          email: true,
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
      user: { ...session.user, username: user.username, image: user.displayAvatarURL(), accent: user.hexAccentColor },
    },
  });
});

routes.all('/signout', async (c) => {
  await handleSignout(c);
  return c.json({ success: true });
});

export default routes;
