/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import { convertS2T } from '@/lib/s2t';

import { AdminConfig } from './admin.types';
import { KvrocksStorage } from './kvrocks.db';
import { RedisStorage } from './redis.db';
import { Favorite, IStorage, PlayRecord, SkipConfig } from './types';
import { UpstashRedisStorage } from './upstash.db';

// storage type 常量: 'localstorage' | 'redis' | 'upstash'，默认 'localstorage'
const STORAGE_TYPE =
  ((process.env.STORAGE_TYPE || process.env.NEXT_PUBLIC_STORAGE_TYPE) as
    | 'localstorage'
    | 'redis'
    | 'upstash'
    | 'kvrocks'
    | undefined) || 'localstorage';

// noop 空存储：当后端存储未配置时使用，避免 500 Internal Server Error
/* eslint-disable @typescript-eslint/no-empty-function */
class NoopStorage implements IStorage {
  async getPlayRecord(): Promise<null> {
    return null;
  }
  async setPlayRecord(): Promise<void> {}
  async getAllPlayRecords(): Promise<Record<string, PlayRecord>> {
    return {};
  }
  async deletePlayRecord(): Promise<void> {}
  async deleteAllPlayRecords(): Promise<void> {}
  async getFavorite(): Promise<null> {
    return null;
  }
  async setFavorite(): Promise<void> {}
  async getAllFavorites(): Promise<Record<string, Favorite>> {
    return {};
  }
  async deleteFavorite(): Promise<void> {}
  async deleteAllFavorites(): Promise<void> {}
  async registerUser(): Promise<void> {}
  async verifyUser(): Promise<boolean> {
    return false;
  }
  async checkUserExist(): Promise<boolean> {
    return false;
  }
  async changePassword(): Promise<void> {}
  async deleteUser(): Promise<void> {}
  async getSearchHistory(): Promise<string[]> {
    return [];
  }
  async addSearchHistory(): Promise<void> {}
  async deleteSearchHistory(): Promise<void> {}
  async getAllUsers(): Promise<string[]> {
    return [];
  }
  async getAdminConfig(): Promise<null> {
    return null;
  }
  async setAdminConfig(): Promise<void> {}
  async getSkipConfig(): Promise<null> {
    return null;
  }
  async setSkipConfig(): Promise<void> {}
  async deleteSkipConfig(): Promise<void> {}
  async getAllSkipConfigs(): Promise<Record<string, SkipConfig>> {
    return {};
  }
  async clearAllData(): Promise<void> {}
}
/* eslint-enable @typescript-eslint/no-empty-function */

function createStorage(): IStorage {
  switch (STORAGE_TYPE) {
    case 'redis':
      if (!process.env.REDIS_URL) {
        console.warn('REDIS_URL not set — Redis storage disabled');
        return new NoopStorage();
      }
      return new RedisStorage();
    case 'upstash':
      if (!process.env.UPSTASH_URL || !process.env.UPSTASH_TOKEN) {
        console.warn(
          'UPSTASH_URL/UPSTASH_TOKEN not set — Upstash storage disabled'
        );
        return new NoopStorage();
      }
      return new UpstashRedisStorage();
    case 'kvrocks':
      if (!process.env.KVROCKS_URL) {
        console.warn('KVROCKS_URL not set — Kvrocks storage disabled');
        return new NoopStorage();
      }
      return new KvrocksStorage();
    case 'localstorage':
    default:
      return new NoopStorage();
  }
}

// 单例存储实例
let storageInstance: IStorage | null = null;

function getStorage(): IStorage {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
}

// 工具函数：生成存储key
export function generateStorageKey(source: string, id: string): string {
  return `${source}+${id}`;
}

// 导出便捷方法
export class DbManager {
  private storage: IStorage;
  private migrationPromise: Promise<void> | null = null;

  constructor() {
    this.storage = getStorage();
    // 启动时自动触发数据迁移（异步，不阻塞构造）
    if (this.storage && typeof this.storage.migrateData === 'function') {
      this.migrationPromise = this.storage
        .migrateData()
        .then(async () => {
          // 数据结构迁移完成后，执行密码哈希迁移
          if (typeof this.storage.migratePasswords === 'function') {
            await this.storage.migratePasswords();
          }
        })
        .catch((err) => {
          console.error('数据迁移异常:', err);
        });
    }
  }

  /** 等待迁移完成（内部方法，首次调用后 migrationPromise 会被置空） */
  private async ensureMigrated(): Promise<void> {
    if (this.migrationPromise) {
      await this.migrationPromise;
      this.migrationPromise = null;
    }
  }

  // 播放记录相关方法
  async getPlayRecord(
    userName: string,
    source: string,
    id: string
  ): Promise<PlayRecord | null> {
    const key = generateStorageKey(source, id);
    return this.storage.getPlayRecord(userName, key);
  }

  async savePlayRecord(
    userName: string,
    source: string,
    id: string,
    record: PlayRecord
  ): Promise<void> {
    // 1. 強行將劇名轉為繁體，作為唯一標識符
    const traditionalName = convertS2T(record.title || '');
    // 2. 清理片源名稱，移除「資源」或「片源」贅詞
    const cleanSource = (record.source_name || '').replace(/(資源|片源)/g, '');
    // 3. 強制使用 `劇名_片源` 作為唯一 Key，確保同一部劇在同一片源下只會有一筆紀錄 (覆蓋更新)
    const historyStorageKey = `${traditionalName}_${cleanSource}`;

    const enrichedRecord = {
      ...record,
      vod_id: id,
      source: source,
    };

    await this.storage.setPlayRecord(
      userName,
      historyStorageKey,
      enrichedRecord
    );
  }

  async getAllPlayRecords(userName: string): Promise<{
    [key: string]: PlayRecord;
  }> {
    await this.ensureMigrated();
    return this.storage.getAllPlayRecords(userName);
  }

  async deletePlayRecord(
    userName: string,
    source: string,
    id: string
  ): Promise<void> {
    try {
      const allRecords = await this.storage.getAllPlayRecords(userName);
      let foundKey: string | null = null;
      if (allRecords) {
        const cleanTargetSource = source.replace(/(資源|片源)/g, '').trim();
        for (const [key, record] of Object.entries(allRecords)) {
          if (!record) continue;
          const recordSource = (record.source || record.source_name || '')
            .replace(/(資源|片源)/g, '')
            .trim();
          const recordId = record.vod_id || record.id || '';
          if (
            recordSource === cleanTargetSource &&
            String(recordId) === String(id)
          ) {
            foundKey = key;
            break;
          }
        }
      }
      if (foundKey) {
        await this.storage.deletePlayRecord(userName, foundKey);
      }
    } catch (err) {
      console.error('Error finding play record to delete:', err);
    }
    const key = generateStorageKey(source, id);
    await this.storage.deletePlayRecord(userName, key);
  }

  async deleteAllPlayRecords(userName: string): Promise<void> {
    await this.storage.deleteAllPlayRecords(userName);
  }

  // 收藏相关方法
  async getFavorite(
    userName: string,
    source: string,
    id: string
  ): Promise<Favorite | null> {
    const key = generateStorageKey(source, id);
    return this.storage.getFavorite(userName, key);
  }

  async saveFavorite(
    userName: string,
    source: string,
    id: string,
    favorite: Favorite
  ): Promise<void> {
    const key = generateStorageKey(source, id);
    await this.storage.setFavorite(userName, key, favorite);
  }

  async getAllFavorites(
    userName: string
  ): Promise<{ [key: string]: Favorite }> {
    await this.ensureMigrated();
    return this.storage.getAllFavorites(userName);
  }

  async deleteFavorite(
    userName: string,
    source: string,
    id: string
  ): Promise<void> {
    const key = generateStorageKey(source, id);
    await this.storage.deleteFavorite(userName, key);
  }

  async deleteAllFavorites(userName: string): Promise<void> {
    await this.storage.deleteAllFavorites(userName);
  }

  async isFavorited(
    userName: string,
    source: string,
    id: string
  ): Promise<boolean> {
    const favorite = await this.getFavorite(userName, source, id);
    return favorite !== null;
  }

  // ---------- 用户相关 ----------
  async registerUser(userName: string, password: string): Promise<void> {
    await this.storage.registerUser(userName, password);
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    return this.storage.verifyUser(userName, password);
  }

  // 检查用户是否已存在
  async checkUserExist(userName: string): Promise<boolean> {
    return this.storage.checkUserExist(userName);
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    await this.storage.changePassword(userName, newPassword);
  }

  async deleteUser(userName: string): Promise<void> {
    await this.storage.deleteUser(userName);
  }

  // ---------- 搜索历史 ----------
  async getSearchHistory(userName: string): Promise<string[]> {
    return this.storage.getSearchHistory(userName);
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    await this.storage.addSearchHistory(userName, keyword);
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    await this.storage.deleteSearchHistory(userName, keyword);
  }

  // 获取全部用户名
  async getAllUsers(): Promise<string[]> {
    if (typeof (this.storage as any).getAllUsers === 'function') {
      return (this.storage as any).getAllUsers();
    }
    return [];
  }

  // ---------- 管理员配置 ----------
  async getAdminConfig(): Promise<AdminConfig | null> {
    if (typeof (this.storage as any).getAdminConfig === 'function') {
      return (this.storage as any).getAdminConfig();
    }
    return null;
  }

  async saveAdminConfig(config: AdminConfig): Promise<void> {
    if (typeof (this.storage as any).setAdminConfig === 'function') {
      await (this.storage as any).setAdminConfig(config);
    }
  }

  // ---------- 跳过片头片尾配置 ----------
  async getSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<SkipConfig | null> {
    if (typeof (this.storage as any).getSkipConfig === 'function') {
      return (this.storage as any).getSkipConfig(userName, source, id);
    }
    return null;
  }

  async setSkipConfig(
    userName: string,
    source: string,
    id: string,
    config: SkipConfig
  ): Promise<void> {
    if (typeof (this.storage as any).setSkipConfig === 'function') {
      await (this.storage as any).setSkipConfig(userName, source, id, config);
    }
  }

  async deleteSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<void> {
    if (typeof (this.storage as any).deleteSkipConfig === 'function') {
      await (this.storage as any).deleteSkipConfig(userName, source, id);
    }
  }

  async getAllSkipConfigs(
    userName: string
  ): Promise<{ [key: string]: SkipConfig }> {
    if (typeof (this.storage as any).getAllSkipConfigs === 'function') {
      return (this.storage as any).getAllSkipConfigs(userName);
    }
    return {};
  }

  // ---------- 数据清理 ----------
  async clearAllData(): Promise<void> {
    if (typeof (this.storage as any).clearAllData === 'function') {
      await (this.storage as any).clearAllData();
    } else {
      throw new Error('存储类型不支持清空数据操作');
    }
  }
}

// 导出默认实例
export const db = new DbManager();
