'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';

const sessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
});

export async function getSessionFromCookies() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('x-session');
  const session = sessionSchema.safeParse(!sessionCookie?.value ? null : JSON.parse(sessionCookie.value));
  
  if (!session.success) {
    console.log('Session not found in cookies', sessionCookie);
    // await deleteSessionFromCookies();
    return null;
  }

  return session?.success ? session.data : null;
}

export async function deleteSessionFromCookies() {
  const cookieStore = cookies();
  cookieStore.delete('x-session');
}