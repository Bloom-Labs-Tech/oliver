import { deleteSessionIdFromCookies, getSessionIdFromCookies } from "~/actions/auth";

export async function GET() {
  const sessionId = await getSessionIdFromCookies();
  if (!sessionId) {
    return Response.json({
      session: null,
    });
  }
  
  const session = await fetch('http://localhost:3001/auth/session', {
    headers: {
      'x-session-id': sessionId,
    },
  }).then((res) => res.json());

  if (!session.success) {
    await deleteSessionIdFromCookies();

    return Response.json({
      session: null,
    });
  }
  
  return Response.json({
    session: session.session,
  });
}