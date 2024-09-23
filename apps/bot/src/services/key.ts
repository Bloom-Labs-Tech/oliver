import { client } from '~/index';
import { generateRandomString } from '~/utils/helpers';

type Prefix = 'test' | 'prod';
export const generateKey = (prefix: Prefix) => {
  return `${prefix}:${generateRandomString(16)}`;
};

export async function getAPIKeys(userId: string) {
  return await client.db.apiKey
    .findMany({
      where: {
        userId: userId,
      },
    })
    .catch(() => []);
}

export async function createAPIKey(userId: string, prefix: Prefix, name?: string | null) {
  const count = await client.db.apiKey.count({
    where: {
      userId,
    },
  });

  if (count >= 5) {
    return 'You have reached the maximum number of API keys';
  }

  return await client.db.apiKey
    .create({
      data: {
        userId: userId,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
        key: generateKey(prefix),
        name,
      },
    })
    .catch(() => null);
}

export async function deleteAPIKey(userId: string, key: string) {
  return await client.db.apiKey
    .delete({
      where: {
        key,
        userId,
      },
    })
    .then(() => true)
    .catch(() => false);
}

export async function getAPIKey(key: string) {
  return await client.db.apiKey.findUnique({
    where: {
      key,
    },
  });
}

export async function deleteAllKeys(userId: string) {
  return await client.db.apiKey
    .deleteMany({
      where: {
        userId,
      },
    })
    .then(() => true)
    .catch(() => false);
}
