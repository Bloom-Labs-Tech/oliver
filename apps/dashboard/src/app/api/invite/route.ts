import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

export async function GET(req: NextRequest) {
  const guildId = req.nextUrl.searchParams.get('guildId');
  const url = new URL('/auth/invite', env.API_URL);
  if (guildId) url.searchParams.set('guildId', guildId);  

  return NextResponse.redirect(url);
}