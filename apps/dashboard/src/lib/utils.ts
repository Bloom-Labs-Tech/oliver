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

export function formatNumberWithSuffix(num: number): string {
  const absNum = Math.abs(num);
  
  if (absNum >= 1e12) {
    return `${(num / 1e12).toFixed(1).replace(/\.0$/, '')}T`; // Trillion
  } 
  if (absNum >= 1e9) {
    return `${(num / 1e9).toFixed(1).replace(/\.0$/, '')}B`; // Billion
  } 
  if (absNum >= 1e6) {
    return `${(num / 1e6).toFixed(1).replace(/\.0$/, '')}M`; // Million
  } 
  if (absNum >= 1e3) {
    return `${(num / 1e3).toFixed(1).replace(/\.0$/, '')}K`; // Thousand
  } 
  return num.toString(); // Less than a thousand
}
