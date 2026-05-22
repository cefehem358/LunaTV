/* eslint-disable no-console,@typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';

import { getConfig, refineConfig, setCachedConfig } from '@/lib/config';
import { db } from '@/lib/db';
import { fetchVideoDetail } from '@/lib/fetchVideoDetail';
import { refreshLiveChannels } from '@/lib/live';
import { SearchResult } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // 验证内部 cron 调用的密钥，防止未授权访问
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${cronSecret}`;
    if (!authHeader || authHeader !== expectedAuth) {
      console.warn('Cron job: 未授权的访问尝试');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  try {
    console.log('Cron job triggered:', new Date().toISOString());

    cronJob();

    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Cron job failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function cronJob() {
  await refreshConfig();
  await refreshAllLiveChannels();
  await refreshRecordAndFavorites();
}

async function refreshAllLiveChannels() {
  const config = await getConfig();

  // 並發刷新所有啟用的直播源
  const refreshPromises = (config.LiveConfig || [])
    .filter((liveInfo) => !liveInfo.disabled)
    .map(async (liveInfo) => {
      try {
        const nums = await refreshLiveChannels(liveInfo);
        liveInfo.channelNumber = nums;
      } catch (error) {
        console.error(
          `刷新直播源失敗 [${liveInfo.name || liveInfo.key}]:`,
          error
        );
        liveInfo.channelNumber = 0;
      }
    });

  // 等待所有刷新任務完成
  await Promise.all(refreshPromises);

  // 保存配置
  await db.saveAdminConfig(config);
}

async function refreshConfig() {
  let config = await getConfig();
  if (
    config &&
    config.ConfigSubscribtion &&
    config.ConfigSubscribtion.URL &&
    config.ConfigSubscribtion.AutoUpdate
  ) {
    try {
      const response = await fetch(config.ConfigSubscribtion.URL);

      if (!response.ok) {
        throw new Error(`請求失敗: ${response.status} ${response.statusText}`);
      }

      const configContent = await response.text();

      // 對 configContent 進行 base58 解碼
      let decodedContent;
      try {
        const bs58 = (await import('bs58')).default;
        const decodedBytes = bs58.decode(configContent);
        decodedContent = new TextDecoder().decode(decodedBytes);
      } catch (decodeError) {
        console.warn('Base58 解碼失敗:', decodeError);
        throw decodeError;
      }

      try {
        JSON.parse(decodedContent);
      } catch (e) {
        throw new Error('配置文件格式錯誤，請檢查 JSON 語法');
      }
      config.ConfigFile = decodedContent;
      config.ConfigSubscribtion.LastCheck = new Date().toISOString();
      config = refineConfig(config);
      await db.saveAdminConfig(config);
      await setCachedConfig(config);
    } catch (e) {
      console.error('刷新配置失敗:', e);
    }
  } else {
    console.log('跳過刷新：未配置訂閱地址或自動更新');
  }
}

async function refreshRecordAndFavorites() {
  try {
    const users = await db.getAllUsers();
    if (process.env.USERNAME && !users.includes(process.env.USERNAME)) {
      users.push(process.env.USERNAME);
    }
    // 函数级缓存：key 为 `${source}+${id}`，值為 Promise<VideoDetail | null>
    const detailCache = new Map<string, Promise<SearchResult | null>>();

    // 獲取詳情 Promise（帶緩存和錯誤處理）
    const getDetail = async (
      source: string,
      id: string,
      fallbackTitle: string
    ): Promise<SearchResult | null> => {
      const key = `${source}+${id}`;
      let promise = detailCache.get(key);
      if (!promise) {
        promise = fetchVideoDetail({
          source,
          id,
          fallbackTitle: fallbackTitle.trim(),
        })
          .then((detail) => {
            const successPromise = Promise.resolve(detail);
            detailCache.set(key, successPromise);
            return detail;
          })
          .catch((err) => {
            console.error(`獲取視頻詳情失敗 (${source}+${id}):`, err);
            return null;
          });
        detailCache.set(key, promise);
      }
      return promise;
    };

    // 并发限制工具
    const runWithConcurrency = async <T>(
      tasks: (() => Promise<T>)[],
      concurrency: number
    ): Promise<T[]> => {
      const results: T[] = [];
      let index = 0;
      const worker = async () => {
        while (index < tasks.length) {
          const i = index++;
          results[i] = await tasks[i]();
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(concurrency, tasks.length) }, () =>
          worker()
        )
      );
      return results;
    };

    // 处理单个用户的播放记录和收藏
    const processUser = async (user: string) => {
      console.log(`開始處理用戶: ${user}`);

      // 播放记录
      try {
        const playRecords = await db.getAllPlayRecords(user);
        const entries = Object.entries(playRecords);
        const totalRecords = entries.length;
        let processedRecords = 0;

        const tasks = entries.map(([key, record]) => async () => {
          try {
            const [source, id] = key.split('+');
            if (!source || !id) {
              console.warn(`跳過無效的播放記錄鍵: ${key}`);
              return;
            }

            const detail = await getDetail(source, id, record.title);
            if (!detail) {
              console.warn(`跳過無法獲取詳情的播放記錄: ${key}`);
              return;
            }

            const episodeCount = detail.episodes?.length || 0;
            if (episodeCount > 0 && episodeCount !== record.total_episodes) {
              await db.savePlayRecord(user, source, id, {
                title: detail.title || record.title,
                source_name: record.source_name,
                cover: detail.poster || record.cover,
                index: record.index,
                total_episodes: episodeCount,
                play_time: record.play_time,
                year: detail.year || record.year,
                total_time: record.total_time,
                save_time: record.save_time,
                search_title: record.search_title,
              });
              console.log(
                `更新播放記錄: ${record.title} (${record.total_episodes} -> ${episodeCount})`
              );
            }

            processedRecords++;
          } catch (err) {
            console.error(`處理播放記錄失敗 (${key}):`, err);
          }
        });

        await runWithConcurrency(tasks, 2); // 限制並發數為 2，降低 1C1G CPU 負載
        console.log(`播放記錄處理完成: ${processedRecords}/${totalRecords}`);
      } catch (err) {
        console.error(`獲取用戶播放記錄失敗 (${user}):`, err);
      }

      // 收藏
      try {
        let favorites = await db.getAllFavorites(user);
        favorites = Object.fromEntries(
          Object.entries(favorites).filter(([_, fav]) => fav.origin !== 'live')
        );
        const favEntries = Object.entries(favorites);
        const totalFavorites = favEntries.length;
        let processedFavorites = 0;

        const tasks = favEntries.map(([key, fav]) => async () => {
          try {
            const [source, id] = key.split('+');
            if (!source || !id) {
              console.warn(`跳過無效的收藏鍵: ${key}`);
              return;
            }

            const favDetail = await getDetail(source, id, fav.title);
            if (!favDetail) {
              console.warn(`跳過無法獲取詳情的收藏: ${key}`);
              return;
            }

            const favEpisodeCount = favDetail.episodes?.length || 0;
            if (favEpisodeCount > 0 && favEpisodeCount !== fav.total_episodes) {
              await db.saveFavorite(user, source, id, {
                title: favDetail.title || fav.title,
                source_name: fav.source_name,
                cover: favDetail.poster || fav.cover,
                year: favDetail.year || fav.year,
                total_episodes: favEpisodeCount,
                save_time: fav.save_time,
                search_title: fav.search_title,
              });
              console.log(
                `更新收藏: ${fav.title} (${fav.total_episodes} -> ${favEpisodeCount})`
              );
            }

            processedFavorites++;
          } catch (err) {
            console.error(`處理收藏失敗 (${key}):`, err);
          }
        });

        await runWithConcurrency(tasks, 2); // 限制並發數為 2，降低 1C1G CPU 負載
        console.log(`收藏處理完成: ${processedFavorites}/${totalFavorites}`);
      } catch (err) {
        console.error(`獲取用戶收藏失敗 (${user}):`, err);
      }
    };

    // 用戶間並發處理（限制 1 個用戶處理完再處理下一個，防止內存溢出）
    const userTasks = users.map((user) => () => processUser(user));
    await runWithConcurrency(userTasks, 1);

    console.log('刷新播放记录/收藏任务完成');
  } catch (err) {
    console.error('刷新播放記錄/收藏任務啟動失敗', err);
  }
}
