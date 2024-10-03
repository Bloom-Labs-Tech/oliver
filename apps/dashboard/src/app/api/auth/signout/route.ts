import { deleteSessionFromCookies, getSessionFromCookies } from "~/actions/auth";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return Response.json({
      success: false,
    });
  }

  const signoutSession = await fetch('http://localhost:3001/auth/signout', {
    headers: {
      'x-session-id': session.id,
    },
  }).then((res) => res.json());

  if (signoutSession.success) {
    await deleteSessionFromCookies();

    return Response.json(session);
  }
  
  return Response.json(session);
}