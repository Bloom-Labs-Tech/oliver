import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

export async function GET(_: NextRequest, { params }: { params: { guild: string } }) {
  const url = new URL('/auth/invite', env.API_URL);
  console.log(params);
  url.searchParams.set('guildId', params.guild);  

  return NextResponse.redirect(url);
}