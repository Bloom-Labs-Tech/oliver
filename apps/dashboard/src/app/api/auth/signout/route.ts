import { deleteSessionIdFromCookies, getSessionIdFromCookies } from "~/actions/auth";

export async function GET() {
  const sessionId = await getSessionIdFromCookies();
  if (!sessionId) {
    return Response.json({
      success: false,
    });
  }

  const session = await fetch('http://localhost:3001/auth/signout', {
    headers: {
      'x-session-id': sessionId,
    },
  }).then((res) => res.json());

  if (session.success) {
    await deleteSessionIdFromCookies();

    return Response.json(session);
  }
  
  return Response.json(session);
}