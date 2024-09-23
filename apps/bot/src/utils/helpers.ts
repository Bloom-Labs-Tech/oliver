import { readdir, stat } from 'node:fs/promises';
import { join } from 'path';
import { ValidationError } from './errors';

export async function getFiles(dir: string, fileList: string[] = []): Promise<string[]> {
  const files = await readdir(dir);

  await Promise.all(
    files.map(async (file) => {
      const filePath = join(dir, file);
      const fileStat = await stat(filePath);

      if (fileStat.isDirectory()) {
        await getFiles(filePath, fileList);
      } else if (file.endsWith('.ts')) {
        fileList.push(filePath.replace(/\\/g, '/'));
      }
    }),
  );

  return fileList;
}

export const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const getOrdinalSuffix = (n: number): string => {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';

  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};

export const pluralize = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

export const combineObjects = <T extends Record<string, unknown>>(...objects: T[]): T => Object.assign({}, ...objects);

export const parseNumber = (value: string | number): number => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    throw new ValidationError('Please provide a valid number');
  }

  return number;
};

export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
};
