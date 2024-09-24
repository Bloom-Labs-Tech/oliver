import OliverAPI from "@oliver/api";
import { cookies } from "next/headers";

export async function GET() {
  const cookiestore = cookies();
  const client = new OliverAPI({
    headers: {
      'x-api-key': cookiestore.get('x-session-id')?.value ?? '',
    }
  });

  const res = await client.guilds.getMany();
  return Response.json(res);
}