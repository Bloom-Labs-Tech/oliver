import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
 
export const env = createEnv({
  server: {
    API_URL: z.string().min(1),
    OLIVER_API_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().min(1),
  },
  runtimeEnv: {
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    OLIVER_API_KEY: process.env.OLIVER_API_KEY,
  },
});