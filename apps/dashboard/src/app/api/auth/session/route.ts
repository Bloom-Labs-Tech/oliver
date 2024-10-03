import { getSessionFromCookies } from "~/actions/auth";

export async function GET() {
  const session = await getSessionFromCookies();

  if (!session) {
    return Response.json({
      session: null,
    });
  }
  
  const sessionWithUser = await fetch('http://localhost:3001/auth/session', {
    headers: {
      'x-session-id': session.id,
    },
  }).then((res) => res.json());

  if (!sessionWithUser.success) {
    console.log('Session not found in API', session);
    // await deleteSessionFromCookies();

    return Response.json({
      session: null,
    });
  }
  
  return Response.json({
    session: sessionWithUser.session,
  });
}