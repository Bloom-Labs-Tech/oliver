'use server';

import { cookies } from 'next/headers';

export async function getSessionIdFromCookies() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get('x-session-id');
  return sessionId?.value;
}

export async function deleteSessionIdFromCookies() {
  const cookieStore = cookies();
  cookieStore.delete('x-session-id');
}