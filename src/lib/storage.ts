import { db } from './db';

// A wrapper to align with the storage.hgetall and storage.hdel methods in the route
export const storage = {
  hgetall: async (key: string): Promise<Record<string, string>> => {
    // Map user:history:${mockUserId} to u:${mockUserId}:pr
    let actualKey = key;
    const match = key.match(/^user:history:(.+)$/);
    if (match) {
      actualKey = `u:${match[1]}:pr`;
    }

    const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';
    const storageImpl = (db as any).storage;
    if (!storageImpl || storageType === 'localstorage') {
      return {};
    }

    const client = storageImpl.client;
    if (!client) return {};

    if (storageType === 'upstash') {
      // Upstash uses hgetall
      const res = await client.hgetall(actualKey);
      if (!res) return {};
      // convert object values to string if they are parsed objects
      const finalRes: Record<string, string> = {};
      for (const [k, v] of Object.entries(res)) {
        finalRes[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
      }
      return finalRes;
    } else {
      // redis and kvrocks use hGetAll
      const res = await client.hGetAll(actualKey);
      return res || {};
    }
  },

  hdel: async (key: string, field: string): Promise<void> => {
    let actualKey = key;
    const match = key.match(/^user:history:(.+)$/);
    if (match) {
      actualKey = `u:${match[1]}:pr`;
    }

    const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';
    const storageImpl = (db as any).storage;
    if (!storageImpl || storageType === 'localstorage') {
      return;
    }

    const client = storageImpl.client;
    if (!client) return;

    if (storageType === 'upstash') {
      await client.hdel(actualKey, field);
    } else {
      await client.hDel(actualKey, field);
    }
  }
};
