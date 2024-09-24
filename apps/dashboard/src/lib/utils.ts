import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseBigInt = (input: string | number | bigint | undefined | null): bigint => {
  try {
    return BigInt(input?.toString().replace(/[^0-9]/g, '') ?? 0);
  } catch {
    return 0n;
  }
}