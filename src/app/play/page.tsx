/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, no-console, @next/next/no-img-element */

'use client';

import Artplayer from 'artplayer';
import Hls from 'hls.js';
import { Heart } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { toDisplayLanguage } from '@/lib/chinese';
import {
  deleteFavorite,
  deletePlayRecord,
  deleteSkipConfig,
  generateStorageKey,
  getAllPlayRecords,
  getSkipConfig,
  isFavorited,
  saveFavorite,
  savePlayRecord,
  saveSkipConfig,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { SearchResult } from '@/lib/types';
import { getVideoResolutionFromM3u8, processImageUrl } from '@/lib/utils';

import EpisodeSelector from '@/components/EpisodeSelector';
import PageLayout from '@/components/PageLayout';

// 擴展 HTMLVideoElement 類型以支持 hls 屬性
declare global {
  interface HTMLVideoElement {
    hls?: any;
  }
}

// Wake Lock API 類型聲明
interface WakeLockSentinel {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
  removeEventListener(type: 'release', listener: () => void): void;
}

// 最長公共子字串長度計算
function getLongestCommonSubstringLength(s1: string, s2: string): number {
  let longest = 0;
  const num = Array(s1.length)
    .fill(0)
    .map(() => Array(s2.length).fill(0));
  for (let i = 0; i < s1.length; i++) {
    for (let j = 0; j < s2.length; j++) {
      if (s1[i] === s2[j]) {
        num[i][j] = i === 0 || j === 0 ? 1 : num[i - 1][j - 1] + 1;
        if (num[i][j] > longest) {
          longest = num[i][j];
        }
      }
    }
  }
  return longest;
}

// 備用關鍵字生成器
function getFallbackQueries(query: string): string[] {
  const cleanQuery = query.trim();
  const fallbacks: string[] = [];

  // 1. 如果有括號，提取括號前的內容
  const noBrackets = cleanQuery.replace(/\s*[（(].*?[）)]\s*/g, '').trim();
  if (noBrackets && noBrackets !== cleanQuery) {
    fallbacks.push(noBrackets);
  }

  // 2. 移除常見的第X季、第X部分後綴
  const noSeason = cleanQuery
    .replace(
      /(第[一二三四五六七八九十\d]+[季期部話话]|[a-zA-Z0-9\s]+Season\s*\d+|S\d+|\s+Part\s*\d+)/gi,
      ''
    )
    .trim();
  if (noSeason && noSeason !== cleanQuery) {
    fallbacks.push(noSeason);
  }

  // 3. 如果長度大於6，截取前6、10個字
  if (cleanQuery.length > 6) {
    fallbacks.push(cleanQuery.slice(0, 6));
    if (cleanQuery.length > 10) {
      fallbacks.push(cleanQuery.slice(0, 10));
    }
  }

  // 4. 如果長度更長，甚至截取前 4 個字
  if (cleanQuery.length > 4) {
    fallbacks.push(cleanQuery.slice(0, 4));
  }

  return Array.from(new Set(fallbacks)).filter((q) => q.length >= 2);
}

function PlayPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // -----------------------------------------------------------------------------
  // 狀態變量（State）
  // -----------------------------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState<
    'searching' | 'preferring' | 'fetching' | 'ready'
  >('searching');
  const [loadingMessage, setLoadingMessage] = useState('正在搜索播放源...');
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<SearchResult | null>(null);

  // 收藏状态
  const [favorited, setFavorited] = useState(false);

  // 跳过片头片尾配置
  const [skipConfig, setSkipConfig] = useState<{
    enable: boolean;
    intro_time: number;
    outro_time: number;
  }>({
    enable: false,
    intro_time: 0,
    outro_time: 0,
  });
  const skipConfigRef = useRef(skipConfig);
  useEffect(() => {
    skipConfigRef.current = skipConfig;
  }, [
    skipConfig,
    skipConfig.enable,
    skipConfig.intro_time,
    skipConfig.outro_time,
  ]);

  // 自動連播開關（從 localStorage 繼承，默認開啟）
  const [autoNext, setAutoNext] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem('enable_autonext');
      if (v !== null) return v === 'true';
    }
    return true;
  });
  const autoNextRef = useRef(autoNext);
  useEffect(() => {
    autoNextRef.current = autoNext;
  }, [autoNext]);

  // 快捷鍵幫助面板
  const [showShortcuts, setShowShortcuts] = useState(false);

  // 子母畫面狀態
  const [, setIsPiP] = useState(false);

  // 跳过检查的时间间隔控制
  const lastSkipCheckRef = useRef(0);

  // 去广告开关（从 localStorage 继承，默认 true）
  const [blockAdEnabled, setBlockAdEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem('enable_blockad');
      if (v !== null) return v === 'true';
    }
    return true;
  });
  const blockAdEnabledRef = useRef(blockAdEnabled);
  useEffect(() => {
    blockAdEnabledRef.current = blockAdEnabled;
  }, [blockAdEnabled]);

  // 視頻基本信息
  const [videoTitle, setVideoTitle] = useState(() => {
    const val = searchParams.get('title');
    return !val || val === 'undefined' || val === 'null' ? '' : val;
  });
  const [videoYear, setVideoYear] = useState(() => {
    const val = searchParams.get('year');
    return !val || val === 'undefined' || val === 'null' ? '' : val;
  });
  const [videoCover, setVideoCover] = useState('');
  const [videoDoubanId, setVideoDoubanId] = useState(0);
  // 當前源和ID
  const [currentSource, setCurrentSource] = useState(() => {
    const val = searchParams.get('source');
    return !val || val === 'undefined' || val === 'null' ? '' : val;
  });
  const [currentId, setCurrentId] = useState(() => {
    const val = searchParams.get('id');
    return !val || val === 'undefined' || val === 'null' ? '' : val;
  });

  // 搜索所需信息
  const [searchTitle] = useState(() => {
    const val = searchParams.get('stitle');
    return !val || val === 'undefined' || val === 'null' ? '' : val;
  });
  const [searchType] = useState(() => {
    const val = searchParams.get('stype');
    return !val || val === 'undefined' || val === 'null' ? '' : val;
  });

  // 是否需要優選
  const [needPrefer, setNeedPrefer] = useState(
    searchParams.get('prefer') === 'true'
  );
  const needPreferRef = useRef(needPrefer);
  useEffect(() => {
    needPreferRef.current = needPrefer;
  }, [needPrefer]);
  // 集數相關
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);

  const currentSourceRef = useRef(currentSource);
  const currentIdRef = useRef(currentId);
  const videoTitleRef = useRef(videoTitle);
  const videoYearRef = useRef(videoYear);
  const detailRef = useRef<SearchResult | null>(detail);
  const currentEpisodeIndexRef = useRef(currentEpisodeIndex);
  const pipKeyHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  // 同步最新值到 refs
  useEffect(() => {
    currentSourceRef.current = currentSource;
    currentIdRef.current = currentId;
    detailRef.current = detail;
    currentEpisodeIndexRef.current = currentEpisodeIndex;
    videoTitleRef.current = videoTitle;
    videoYearRef.current = videoYear;
  }, [
    currentSource,
    currentId,
    detail,
    currentEpisodeIndex,
    videoTitle,
    videoYear,
  ]);

  // 視頻播放地址
  const [videoUrl, setVideoUrl] = useState('');

  // 總集數
  const totalEpisodes = detail?.episodes?.length || 0;

  // 用於記錄是否需要在播放器 ready 後跳轉到指定進度
  const resumeTimeRef = useRef<number | null>(null);
  // 上次使用的音量，默認 0.7
  const lastVolumeRef = useRef<number>(0.7);
  // 上次使用的播放速率，默認 1.0
  const lastPlaybackRateRef = useRef<number>(1.0);

  // 換源相關狀態
  const [availableSources, setAvailableSources] = useState<SearchResult[]>([]);
  const [sourceSearchLoading, setSourceSearchLoading] = useState(false);
  const [sourceSearchError, setSourceSearchError] = useState<string | null>(
    null
  );

  // 優選和測速開關
  const [optimizationEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('enableOptimization');
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch {
          /* ignore */
        }
      }
    }
    return true;
  });

  // 保存優選時的測速結果，避免EpisodeSelector重複測速
  const [precomputedVideoInfo, setPrecomputedVideoInfo] = useState<
    Map<string, { quality: string; loadSpeed: string; pingTime: number }>
  >(new Map());

  // 摺疊狀態（僅在 lg 及以上熒幕有效）
  const [isEpisodeSelectorCollapsed, setIsEpisodeSelectorCollapsed] =
    useState(false);

  // 換源加載狀態
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoLoadingStage, setVideoLoadingStage] = useState<
    'initing' | 'sourceChanging'
  >('initing');

  // 播放進度保存相關
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  const artPlayerRef = useRef<any>(null);
  const artRef = useRef<HTMLDivElement | null>(null);

  // Wake Lock 相關
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // -----------------------------------------------------------------------------
  // 工具函數（Utils）
  // -----------------------------------------------------------------------------

  // 播放源優選函數
  const preferBestSource = async (
    sources: SearchResult[]
  ): Promise<SearchResult> => {
    if (sources.length === 1) return sources[0];

    // 將播放源均分為兩批，並發測速各批，避免一次性過多請求
    const batchSize = Math.ceil(sources.length / 2);
    const allResults: Array<{
      source: SearchResult;
      testResult: { quality: string; loadSpeed: string; pingTime: number };
    } | null> = [];

    for (let start = 0; start < sources.length; start += batchSize) {
      const batchSources = sources.slice(start, start + batchSize);
      const batchResults = await Promise.all(
        batchSources.map(async (source) => {
          try {
            // 檢查是否有第一集的播放地址
            if (!source.episodes || source.episodes.length === 0) {
              console.warn(`播放源 ${source.source_name} 沒有可用的播放地址`);
              return null;
            }

            const episodeUrl =
              source.episodes.length > 1
                ? source.episodes[1]
                : source.episodes[0];
            const testResult = await getVideoResolutionFromM3u8(episodeUrl);

            return {
              source,
              testResult,
            };
          } catch (error) {
            return null;
          }
        })
      );
      allResults.push(...batchResults);
    }

    // 等待所有測速完成，包含成功和失敗的結果
    // 保存所有測速結果到 precomputedVideoInfo，供 EpisodeSelector 使用（包含錯誤結果）
    const newVideoInfoMap = new Map<
      string,
      {
        quality: string;
        loadSpeed: string;
        pingTime: number;
        hasError?: boolean;
      }
    >();
    allResults.forEach((result, index) => {
      const source = sources[index];
      const sourceKey = `${source.source}-${source.id}`;

      if (result) {
        // 成功的結果
        newVideoInfoMap.set(sourceKey, result.testResult);
      }
    });

    // 過濾出成功的結果用於優選計算
    const successfulResults = allResults.filter(Boolean) as Array<{
      source: SearchResult;
      testResult: { quality: string; loadSpeed: string; pingTime: number };
    }>;

    setPrecomputedVideoInfo(newVideoInfoMap);

    if (successfulResults.length === 0) {
      console.warn('所有播放源測速都失敗，使用第一個播放源');
      return sources[0];
    }

    // 找出所有有效速度的最大值，用於線性映射
    const validSpeeds = successfulResults
      .map((result) => {
        const speedStr = result.testResult.loadSpeed;
        if (speedStr === '未知' || speedStr === '測量中...') return 0;

        const match = speedStr.match(/^([\d.]+)\s*(KB\/s|MB\/s)$/);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = match[2];
        return unit === 'MB/s' ? value * 1024 : value; // 統一轉換為 KB/s
      })
      .filter((speed) => speed > 0);

    const maxSpeed = validSpeeds.length > 0 ? Math.max(...validSpeeds) : 1024; // 默認1MB/s作為基準

    // 找出所有有效延遲的最小值和最大值，用於線性映射
    const validPings = successfulResults
      .map((result) => result.testResult.pingTime)
      .filter((ping) => ping > 0);

    const minPing = validPings.length > 0 ? Math.min(...validPings) : 50;
    const maxPing = validPings.length > 0 ? Math.max(...validPings) : 1000;

    // 計算每個結果的評分
    const resultsWithScore = successfulResults.map((result) => ({
      ...result,
      score: calculateSourceScore(
        result.testResult,
        maxSpeed,
        minPing,
        maxPing
      ),
    }));

    // 按綜合評分排序，選擇最佳播放源
    resultsWithScore.sort((a, b) => b.score - a.score);

    console.log('播放源評分排序結果:');
    resultsWithScore.forEach((result, index) => {
      console.log(
        `${index + 1}. ${
          result.source.source_name
        } - 評分: ${result.score.toFixed(2)} (${result.testResult.quality}, ${
          result.testResult.loadSpeed
        }, ${result.testResult.pingTime}ms)`
      );
    });

    return resultsWithScore[0].source;
  };

  // 計算播放源綜合評分
  const calculateSourceScore = (
    testResult: {
      quality: string;
      loadSpeed: string;
      pingTime: number;
    },
    maxSpeed: number,
    minPing: number,
    maxPing: number
  ): number => {
    let score = 0;

    // 分辨率評分 (40% 權重)
    const qualityScore = (() => {
      switch (testResult.quality) {
        case '4K':
          return 100;
        case '2K':
          return 85;
        case '1080p':
          return 75;
        case '720p':
          return 60;
        case '480p':
          return 40;
        case 'SD':
          return 20;
        default:
          return 0;
      }
    })();
    score += qualityScore * 0.4;

    // 下載速度評分 (40% 權重) - 基於最大速度線性映射
    const speedScore = (() => {
      const speedStr = testResult.loadSpeed;
      if (speedStr === '未知' || speedStr === '測量中...') return 30;

      // 解析速度值
      const match = speedStr.match(/^([\d.]+)\s*(KB\/s|MB\/s)$/);
      if (!match) return 30;

      const value = parseFloat(match[1]);
      const unit = match[2];
      const speedKBps = unit === 'MB/s' ? value * 1024 : value;

      // 基於最大速度線性映射，最高100分
      const speedRatio = speedKBps / maxSpeed;
      return Math.min(100, Math.max(0, speedRatio * 100));
    })();
    score += speedScore * 0.4;

    // 網路延遲評分 (20% 權重) - 基於延遲範圍線性映射
    const pingScore = (() => {
      const ping = testResult.pingTime;
      if (ping <= 0) return 0; // 無效延遲給默認分

      // 如果所有延遲都相同，給滿分
      if (maxPing === minPing) return 100;

      // 線性映射：最低延遲=100分，最高延遲=0分
      const pingRatio = (maxPing - ping) / (maxPing - minPing);
      return Math.min(100, Math.max(0, pingRatio * 100));
    })();
    score += pingScore * 0.2;

    return Math.round(score * 100) / 100; // 保留兩位小數
  };

  // 更新視頻地址
  const updateVideoUrl = (
    detailData: SearchResult | null,
    episodeIndex: number
  ) => {
    if (
      !detailData ||
      !detailData.episodes ||
      episodeIndex >= detailData.episodes.length
    ) {
      setVideoUrl('');
      return;
    }
    const newUrl = detailData?.episodes[episodeIndex] || '';
    if (newUrl !== videoUrl) {
      setVideoUrl(newUrl);
    }
  };

  const ensureVideoSource = (video: HTMLVideoElement | null, url: string) => {
    if (!video || !url) return;
    const sources = Array.from(video.getElementsByTagName('source'));
    const existed = sources.some((s) => s.src === url);
    if (!existed) {
      // 移除舊的 source，保持唯一
      sources.forEach((s) => s.remove());
      const sourceEl = document.createElement('source');
      sourceEl.src = url;
      video.appendChild(sourceEl);
    }

    // 始終允許遠程播放（AirPlay / Cast）
    video.disableRemotePlayback = false;
    // 如果曾經有禁用屬性，移除之
    if (video.hasAttribute('disableRemotePlayback')) {
      video.removeAttribute('disableRemotePlayback');
    }
  };

  // Wake Lock 相關函數
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request(
          'screen'
        );
        console.log('Wake Lock 已啟用');
      }
    } catch (err) {
      console.warn('Wake Lock 請求失敗:', err);
    }
  };

  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake Lock 已釋放');
      }
    } catch (err) {
      console.warn('Wake Lock 釋放失敗:', err);
    }
  };

  // 清理播放器資源的統一函數
  const cleanupPlayer = () => {
    if (artPlayerRef.current) {
      try {
        // 銷燬 HLS 實例
        if (artPlayerRef.current.video && artPlayerRef.current.video.hls) {
          artPlayerRef.current.video.hls.destroy();
        }

        // 銷燬 ArtPlayer 實例
        artPlayerRef.current.destroy();
        artPlayerRef.current = null;

        console.log('播放器資源已清理');
      } catch (err) {
        console.warn('清理播放器資源時出錯:', err);
        artPlayerRef.current = null;
      }
    }
  };

  // 去廣告相關函數
  function filterAdsFromM3U8(m3u8Content: string): string {
    if (!m3u8Content) return '';

    // 按行分割M3U8內容
    const lines = m3u8Content.split('\n');
    const filteredLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 只過濾#EXT-X-DISCONTINUITY標識
      if (!line.includes('#EXT-X-DISCONTINUITY')) {
        filteredLines.push(line);
      }
    }

    return filteredLines.join('\n');
  }

  // 跳過片頭片尾配置相關函數
  const handleSkipConfigChange = async (newConfig: {
    enable: boolean;
    intro_time: number;
    outro_time: number;
  }) => {
    if (!currentSourceRef.current || !currentIdRef.current) return;

    try {
      setSkipConfig(newConfig);
      if (!newConfig.enable && !newConfig.intro_time && !newConfig.outro_time) {
        await deleteSkipConfig(currentSourceRef.current, currentIdRef.current);
        artPlayerRef.current.setting.update({
          name: '跳過片頭片尾',
          html: '跳過片頭片尾',
          switch: skipConfigRef.current.enable,
          onSwitch: function (item: any) {
            const newConfig = {
              ...skipConfigRef.current,
              enable: !item.switch,
            };
            handleSkipConfigChange(newConfig);
            return !item.switch;
          },
        });
        artPlayerRef.current.setting.update({
          name: '設置片頭',
          html: '設置片頭',
          icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="12" r="2" fill="#ffffff"/><path d="M9 12L17 12" stroke="#ffffff" stroke-width="2"/><path d="M17 6L17 18" stroke="#ffffff" stroke-width="2"/></svg>',
          tooltip:
            skipConfigRef.current.intro_time === 0
              ? '設置片頭時間'
              : `${formatTime(skipConfigRef.current.intro_time)}`,
          onClick: function () {
            const currentTime = artPlayerRef.current?.currentTime || 0;
            if (currentTime > 0) {
              const newConfig = {
                ...skipConfigRef.current,
                intro_time: currentTime,
              };
              handleSkipConfigChange(newConfig);
              return `${formatTime(currentTime)}`;
            }
          },
        });
        artPlayerRef.current.setting.update({
          name: '設置片尾',
          html: '設置片尾',
          icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 6L7 18" stroke="#ffffff" stroke-width="2"/><path d="M7 12L15 12" stroke="#ffffff" stroke-width="2"/><circle cx="19" cy="12" r="2" fill="#ffffff"/></svg>',
          tooltip:
            skipConfigRef.current.outro_time >= 0
              ? '設置片尾時間'
              : `-${formatTime(-skipConfigRef.current.outro_time)}`,
          onClick: function () {
            const outroTime =
              -(
                artPlayerRef.current?.duration -
                artPlayerRef.current?.currentTime
              ) || 0;
            if (outroTime < 0) {
              const newConfig = {
                ...skipConfigRef.current,
                outro_time: outroTime,
              };
              handleSkipConfigChange(newConfig);
              return `-${formatTime(-outroTime)}`;
            }
          },
        });
      } else {
        await saveSkipConfig(
          currentSourceRef.current,
          currentIdRef.current,
          newConfig
        );
      }
      console.log('跳過片頭片尾配置已保存:', newConfig);
    } catch (err) {
      console.error('保存跳過片頭片尾配置失敗:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);

    if (hours === 0) {
      // 不到一小時，格式為 00:00
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
    } else {
      // 超過一小時，格式為 00:00:00
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  class CustomHlsJsLoader extends Hls.DefaultConfig.loader {
    constructor(config: any) {
      super(config);
      const load = this.load.bind(this);
      this.load = function (context: any, config: any, callbacks: any) {
        // 攔截manifest和level請求
        if (
          (context as any).type === 'manifest' ||
          (context as any).type === 'level'
        ) {
          const onSuccess = callbacks.onSuccess;
          callbacks.onSuccess = function (
            response: any,
            stats: any,
            context: any
          ) {
            // 如果是m3u8文件，處理內容以移除廣告分段
            if (response.data && typeof response.data === 'string') {
              // 過濾掉廣告段 - 實現更精確的廣告過濾邏輯
              response.data = filterAdsFromM3U8(response.data);
            }
            return onSuccess(response, stats, context, null);
          };
        }
        // 執行原始load方法
        load(context, config, callbacks);
      };
    }
  }

  // 當集數索引變化時自動更新視頻地址
  useEffect(() => {
    updateVideoUrl(detail, currentEpisodeIndex);
  }, [detail, currentEpisodeIndex]);

  // 進入頁面時直接獲取全部源信息
  useEffect(() => {
    const fetchSourceDetail = async (
      source: string,
      id: string
    ): Promise<SearchResult[]> => {
      try {
        const detailResponse = await fetch(
          `/api/detail?source=${source}&id=${id}`
        );
        if (!detailResponse.ok) {
          throw new Error('獲取視頻詳情失敗');
        }
        const detailData = (await detailResponse.json()) as SearchResult;
        return [detailData];
      } catch (err) {
        console.error('獲取視頻詳情失敗:', err);
        return [];
      } finally {
        setSourceSearchLoading(false);
      }
    };
    const fetchSourcesData = async (query: string): Promise<SearchResult[]> => {
      // 根據搜索詞獲取全部源信息
      const doFetchAndFilter = async (
        searchQuery: string
      ): Promise<SearchResult[]> => {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        if (!response.ok) {
          throw new Error('搜索失敗');
        }
        const data = await response.json();

        // 處理搜索結果，根據規則過濾（加入繁簡轉換與模糊匹配）
        return (data.results || []).filter((result: SearchResult) => {
          const normalizedResultTitle = toDisplayLanguage(
            result.title.replaceAll(' ', '').toLowerCase()
          );
          const normalizedVideoTitle = toDisplayLanguage(
            videoTitleRef.current.replaceAll(' ', '').toLowerCase()
          );

          let titlesMatch = normalizedResultTitle === normalizedVideoTitle;
          if (!titlesMatch && normalizedVideoTitle.length > 2) {
            titlesMatch =
              normalizedResultTitle.includes(normalizedVideoTitle) ||
              normalizedVideoTitle.includes(normalizedResultTitle);
          }

          // 模糊匹配退路 (擁有長度 >= 4 的最長公共子字串，且重合度大於 50%)
          if (!titlesMatch && normalizedVideoTitle.length >= 4) {
            const lcsLen = getLongestCommonSubstringLength(
              normalizedResultTitle,
              normalizedVideoTitle
            );
            const minLen = Math.min(
              normalizedResultTitle.length,
              normalizedVideoTitle.length
            );
            if (lcsLen >= 4 && minLen > 0 && lcsLen / minLen >= 0.5) {
              titlesMatch = true;
            }
          }

          // 比較年份 (放寬匹配，如年份相差不超過1年)
          let yearsMatch = true;
          if (videoYearRef.current && result.year) {
            const vYear = videoYearRef.current.replace(/\D/g, '');
            const rYear = result.year.replace(/\D/g, '');
            if (vYear && rYear && rYear !== '0') {
              const vNum = parseInt(vYear, 10);
              const rNum = parseInt(rYear, 10);
              if (!isNaN(vNum) && !isNaN(rNum)) {
                yearsMatch = Math.abs(vNum - rNum) <= 1;
              }
            }
          }

          // 類型匹配
          let typeMatch = true;
          if (searchType) {
            const typeName = (result.type_name || '').toLowerCase();
            const className = (result.class || '').toLowerCase();
            if (searchType === 'tv') {
              typeMatch =
                typeName.includes('剧') ||
                typeName.includes('季') ||
                typeName.includes('综艺') ||
                typeName.includes('动漫') ||
                className.includes('剧') ||
                className.includes('季') ||
                className.includes('综艺') ||
                className.includes('动漫') ||
                result.episodes.length > 1;
            } else if (searchType === 'movie') {
              const isMovieKeyword =
                typeName.includes('电影') ||
                typeName.includes('片') ||
                typeName.includes('影') ||
                className.includes('电影') ||
                className.includes('片') ||
                className.includes('影');
              const isTvKeyword =
                typeName.includes('剧') ||
                typeName.includes('季') ||
                className.includes('剧') ||
                className.includes('季');

              if (isMovieKeyword && !isTvKeyword) {
                typeMatch = true;
              } else if (isTvKeyword) {
                typeMatch = false;
              } else {
                typeMatch = result.episodes.length === 1;
              }
            }
          }

          return titlesMatch && yearsMatch && typeMatch;
        });
      };

      try {
        let results = await doFetchAndFilter(query);
        if (results.length > 0) {
          setAvailableSources(results);
          return results;
        }

        // 如果原標題找不到，自動嘗試備用/縮短後的關鍵字搜尋
        const fallbackQueries = getFallbackQueries(query);
        console.warn(
          '原標題搜尋不到片源，開始嘗試備用關鍵字:',
          fallbackQueries
        );

        for (const fbQuery of fallbackQueries) {
          try {
            results = await doFetchAndFilter(fbQuery);
            if (results.length > 0) {
              console.log(
                `使用備用關鍵字 [${fbQuery}] 成功尋找到 ${results.length} 個片源`
              );
              setAvailableSources(results);
              return results;
            }
          } catch (e) {
            console.error(`備用關鍵字 [${fbQuery}] 搜尋出錯:`, e);
          }
        }

        setAvailableSources([]);
        return [];
      } catch (err) {
        setSourceSearchError(err instanceof Error ? err.message : '搜索失敗');
        setAvailableSources([]);
        return [];
      } finally {
        setSourceSearchLoading(false);
      }
    };

    const initAll = async () => {
      if (!currentSource && !currentId && !videoTitle && !searchTitle) {
        setError('缺少必要參數');
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadingStage(currentSource && currentId ? 'fetching' : 'searching');
      setLoadingMessage(
        currentSource && currentId
          ? '🎬 正在獲取視頻詳情...'
          : '🔍 正在搜索播放源...'
      );

      let sourcesInfo = await fetchSourcesData(searchTitle || videoTitle);
      if (
        currentSource &&
        currentId &&
        !sourcesInfo.some(
          (source) => source.source === currentSource && source.id === currentId
        )
      ) {
        const currentDetailList = await fetchSourceDetail(
          currentSource,
          currentId
        );
        if (currentDetailList.length > 0) {
          sourcesInfo = [...currentDetailList, ...sourcesInfo];
          setAvailableSources(sourcesInfo);
        }
      }
      if (sourcesInfo.length === 0) {
        setError('未找到匹配結果');
        setLoading(false);
        return;
      }

      let detailData: SearchResult = sourcesInfo[0];
      // 指定源和id且無需優選
      if (currentSource && currentId && !needPreferRef.current) {
        const target = sourcesInfo.find(
          (source) => source.source === currentSource && source.id === currentId
        );
        if (target) {
          detailData = target;
        } else {
          console.warn(
            `未找到指定的源 ${currentSource} 和 ID ${currentId}，自動退回到優選其他可用片源`
          );
          if (optimizationEnabled) {
            setLoadingStage('preferring');
            setLoadingMessage('⚡ 正在優選最佳播放源...');
            detailData = await preferBestSource(sourcesInfo);
          } else {
            detailData = sourcesInfo[0];
          }
        }
      }

      // 未指定源和 id 或需要優選，且開啟優選開關
      if (
        (!currentSource || !currentId || needPreferRef.current) &&
        optimizationEnabled
      ) {
        setLoadingStage('preferring');
        setLoadingMessage('⚡ 正在優選最佳播放源...');

        detailData = await preferBestSource(sourcesInfo);
      }

      console.log(detailData.source, detailData.id);

      setNeedPrefer(false);
      setCurrentSource(detailData.source);
      setCurrentId(detailData.id);
      setVideoYear(detailData.year);
      setVideoTitle(detailData.title || videoTitleRef.current);
      setVideoCover(detailData.poster);
      setVideoDoubanId(detailData.douban_id || 0);
      setDetail(detailData);
      if (currentEpisodeIndex >= detailData.episodes.length) {
        setCurrentEpisodeIndex(0);
      }

      // 規範URL參數
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('source', detailData.source);
      newUrl.searchParams.set('id', detailData.id);
      newUrl.searchParams.set('year', detailData.year);
      newUrl.searchParams.set('title', detailData.title);
      newUrl.searchParams.delete('prefer');
      window.history.replaceState({}, '', newUrl.toString());

      setLoadingStage('ready');
      setLoadingMessage('✨ 準備就緒，即將開始播放...');

      // 短暫延遲讓用戶看到完成狀態
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };

    initAll();
  }, []);

  // 播放記錄處理
  useEffect(() => {
    // 僅在初次掛載時檢查播放記錄
    const initFromHistory = async () => {
      if (!currentSource || !currentId) return;

      try {
        const allRecords = await getAllPlayRecords();
        const key = generateStorageKey(currentSource, currentId);
        let record = allRecords[key];
        if (!record) {
          record = Object.values(allRecords).find(
            (r: any) =>
              r &&
              (r.vod_id === currentId ||
                r.id === currentId ||
                (r.key &&
                  r.key.includes('+') &&
                  r.key.split('+')[1] === currentId)) &&
              r.source === currentSource
          );
        }

        if (record) {
          const targetIndex = record.index - 1;
          const targetTime = record.play_time;

          // 更新當前選集索引
          if (targetIndex !== currentEpisodeIndex) {
            setCurrentEpisodeIndex(targetIndex);
          }

          // 保存待恢復的播放進度，待播放器就緒後跳轉
          resumeTimeRef.current = targetTime;
        }
      } catch (err) {
        console.error('讀取播放記錄失敗:', err);
      }
    };

    initFromHistory();
  }, []);

  // 跳過片頭片尾配置處理
  useEffect(() => {
    // 僅在初次掛載時檢查跳過片頭片尾配置
    const initSkipConfig = async () => {
      if (!currentSource || !currentId) return;

      try {
        const config = await getSkipConfig(currentSource, currentId);
        if (config) {
          setSkipConfig(config);
        }
      } catch (err) {
        console.error('讀取跳過片頭片尾配置失敗:', err);
      }
    };

    initSkipConfig();
  }, []);

  // 處理換源
  const handleSourceChange = async (
    newSource: string,
    newId: string,
    newTitle: string
  ) => {
    try {
      // 顯示換源加載狀態
      setVideoLoadingStage('sourceChanging');
      setIsVideoLoading(true);

      // 記錄當前播放進度（僅在同一集數切換時恢復）
      const currentPlayTime = artPlayerRef.current?.currentTime || 0;
      console.log('換源前當前播放時間:', currentPlayTime);

      // 清除前一個歷史記錄
      if (currentSourceRef.current && currentIdRef.current) {
        try {
          await deletePlayRecord(
            currentSourceRef.current,
            currentIdRef.current
          );
          console.log('已清除前一個播放記錄');
        } catch (err) {
          console.error('清除播放記錄失敗:', err);
        }
      }

      // 清除並設置下一個跳過片頭片尾配置
      if (currentSourceRef.current && currentIdRef.current) {
        try {
          await deleteSkipConfig(
            currentSourceRef.current,
            currentIdRef.current
          );
          await saveSkipConfig(newSource, newId, skipConfigRef.current);
        } catch (err) {
          console.error('清除跳過片頭片尾配置失敗:', err);
        }
      }

      const newDetail = availableSources.find(
        (source) => source.source === newSource && source.id === newId
      );
      if (!newDetail) {
        setError('未找到匹配結果');
        return;
      }

      // 嘗試跳轉到當前正在播放的集數
      let targetIndex = currentEpisodeIndex;

      // 如果當前集數超出新源的範圍，則跳轉到第一集
      if (!newDetail.episodes || targetIndex >= newDetail.episodes.length) {
        targetIndex = 0;
      }

      // 如果仍然是同一集數且播放進度有效，則在播放器就緒後恢復到原始進度
      if (targetIndex !== currentEpisodeIndex) {
        resumeTimeRef.current = 0;
      } else if (
        (!resumeTimeRef.current || resumeTimeRef.current === 0) &&
        currentPlayTime > 1
      ) {
        resumeTimeRef.current = currentPlayTime;
      }

      // 更新URL參數（不刷新頁面）
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('source', newSource);
      newUrl.searchParams.set('id', newId);
      newUrl.searchParams.set('year', newDetail.year);
      window.history.replaceState({}, '', newUrl.toString());

      setVideoTitle(newDetail.title || newTitle);
      setVideoYear(newDetail.year);
      setVideoCover(newDetail.poster);
      setVideoDoubanId(newDetail.douban_id || 0);
      setCurrentSource(newSource);
      setCurrentId(newId);
      setDetail(newDetail);
      setCurrentEpisodeIndex(targetIndex);
    } catch (err) {
      // 隱藏換源加載狀態
      setIsVideoLoading(false);
      setError(err instanceof Error ? err.message : '換源失敗');
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 集數切換
  // ---------------------------------------------------------------------------
  // 處理集數切換
  const handleEpisodeChange = (episodeNumber: number) => {
    if (episodeNumber >= 0 && episodeNumber < totalEpisodes) {
      // 在更換集數前保存當前播放進度
      if (artPlayerRef.current && artPlayerRef.current.paused) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(episodeNumber);
    }
  };

  const handlePreviousEpisode = () => {
    const d = detailRef.current;
    const idx = currentEpisodeIndexRef.current;
    if (d && d.episodes && idx > 0) {
      if (artPlayerRef.current && !artPlayerRef.current.paused) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(idx - 1);
    }
  };

  const handleNextEpisode = () => {
    const d = detailRef.current;
    const idx = currentEpisodeIndexRef.current;
    if (d && d.episodes && idx < d.episodes.length - 1) {
      if (artPlayerRef.current && !artPlayerRef.current.paused) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(idx + 1);
    }
  };

  // ---------------------------------------------------------------------------
  // 鍵盤快捷鍵
  // ---------------------------------------------------------------------------
  // 處理全局快捷鍵
  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    // 忽略輸入框中的按鍵事件
    if (
      (e.target as HTMLElement).tagName === 'INPUT' ||
      (e.target as HTMLElement).tagName === 'TEXTAREA'
    )
      return;

    // Alt + 左箭頭 = 上一集
    if (e.altKey && e.key === 'ArrowLeft') {
      if (detailRef.current && currentEpisodeIndexRef.current > 0) {
        handlePreviousEpisode();
        e.preventDefault();
      }
    }

    // Alt + 右箭頭 = 下一集
    if (e.altKey && e.key === 'ArrowRight') {
      const d = detailRef.current;
      const idx = currentEpisodeIndexRef.current;
      if (d && idx < d.episodes.length - 1) {
        handleNextEpisode();
        e.preventDefault();
      }
    }

    // 左箭頭 = 快退
    if (!e.altKey && e.key === 'ArrowLeft') {
      if (artPlayerRef.current && artPlayerRef.current.currentTime > 5) {
        artPlayerRef.current.currentTime -= 10;
        e.preventDefault();
      }
    }

    // 右箭頭 = 快進
    if (!e.altKey && e.key === 'ArrowRight') {
      if (
        artPlayerRef.current &&
        artPlayerRef.current.currentTime < artPlayerRef.current.duration - 5
      ) {
        artPlayerRef.current.currentTime += 10;
        e.preventDefault();
      }
    }

    // 上箭頭 = 音量+
    if (e.key === 'ArrowUp') {
      if (artPlayerRef.current && artPlayerRef.current.volume < 1) {
        artPlayerRef.current.volume =
          Math.round((artPlayerRef.current.volume + 0.1) * 10) / 10;
        artPlayerRef.current.notice.show = `音量: ${Math.round(
          artPlayerRef.current.volume * 100
        )}`;
        e.preventDefault();
      }
    }

    // 下箭頭 = 音量-
    if (e.key === 'ArrowDown') {
      if (artPlayerRef.current && artPlayerRef.current.volume > 0) {
        artPlayerRef.current.volume =
          Math.round((artPlayerRef.current.volume - 0.1) * 10) / 10;
        artPlayerRef.current.notice.show = `音量: ${Math.round(
          artPlayerRef.current.volume * 100
        )}`;
        e.preventDefault();
      }
    }

    // 空格 = 播放/暫停
    if (e.key === ' ') {
      if (artPlayerRef.current) {
        artPlayerRef.current.toggle();
        e.preventDefault();
      }
    }

    // f 鍵 = 切換全屏
    if (e.key === 'f' || e.key === 'F') {
      if (artPlayerRef.current) {
        artPlayerRef.current.fullscreen = !artPlayerRef.current.fullscreen;
        e.preventDefault();
      }
    }

    // ? 或 h 鍵 = 顯示快捷鍵幫助
    if (e.key === '?' || e.key === 'h' || e.key === 'H') {
      setShowShortcuts((prev) => !prev);
      e.preventDefault();
    }
  };

  // ---------------------------------------------------------------------------
  // 播放記錄相關
  // ---------------------------------------------------------------------------
  // 保存播放進度
  const saveCurrentPlayProgress = async () => {
    if (
      !artPlayerRef.current ||
      !currentSourceRef.current ||
      !currentIdRef.current ||
      !videoTitleRef.current ||
      !detailRef.current?.source_name
    ) {
      return;
    }

    const player = artPlayerRef.current;
    const currentTime = player.currentTime || 0;
    const duration = player.duration || 0;

    // 如果播放時間太短（少於5秒）或者視頻時長無效，不保存
    if (currentTime < 1 || !duration) {
      return;
    }

    try {
      await savePlayRecord(currentSourceRef.current, currentIdRef.current, {
        title: videoTitleRef.current,
        source_name: detailRef.current?.source_name || '',
        year: detailRef.current?.year,
        cover: detailRef.current?.poster || '',
        index: currentEpisodeIndexRef.current + 1, // 轉換為1基索引
        total_episodes: detailRef.current?.episodes.length || 1,
        play_time: Math.floor(currentTime),
        total_time: Math.floor(duration),
        save_time: Date.now(),
        search_title: searchTitle,
      });

      lastSaveTimeRef.current = Date.now();
      console.log('播放進度已保存:', {
        title: videoTitleRef.current,
        episode: currentEpisodeIndexRef.current + 1,
        year: detailRef.current?.year,
        progress: `${Math.floor(currentTime)}/${Math.floor(duration)}`,
      });
    } catch (err) {
      console.error('保存播放進度失敗:', err);
    }
  };

  useEffect(() => {
    // 頁面即將解除安裝時保存播放進度和清理資源
    const handleBeforeUnload = () => {
      saveCurrentPlayProgress();
      releaseWakeLock();
      cleanupPlayer();
    };

    // 頁面可見性變化時保存播放進度和釋放 Wake Lock
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentPlayProgress();
        releaseWakeLock();
      } else if (document.visibilityState === 'visible') {
        // 頁面重新可見時，如果正在播放則重新請求 Wake Lock
        if (artPlayerRef.current && !artPlayerRef.current.paused) {
          requestWakeLock();
        }
      }
    };

    // 添加事件監聽器
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // 清理事件監聽器
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentEpisodeIndex, detail, artPlayerRef.current]);

  // 清理定時器
  useEffect(() => {
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 收藏相關
  // ---------------------------------------------------------------------------
  // 每當 source 或 id 變化時檢查收藏狀態
  useEffect(() => {
    if (!currentSource || !currentId) return;
    (async () => {
      try {
        const fav = await isFavorited(currentSource, currentId);
        setFavorited(fav);
      } catch (err) {
        console.error('檢查收藏狀態失敗:', err);
      }
    })();
  }, [currentSource, currentId]);

  // 監聽收藏數據更新事件
  useEffect(() => {
    if (!currentSource || !currentId) return;

    const unsubscribe = subscribeToDataUpdates(
      'favoritesUpdated',
      (favorites: Record<string, any>) => {
        const key = generateStorageKey(currentSource, currentId);
        const isFav = !!favorites[key];
        setFavorited(isFav);
      }
    );

    return unsubscribe;
  }, [currentSource, currentId]);

  // 切換收藏
  const handleToggleFavorite = async () => {
    if (
      !videoTitleRef.current ||
      !detailRef.current ||
      !currentSourceRef.current ||
      !currentIdRef.current
    )
      return;

    try {
      if (favorited) {
        // 如果已收藏，刪除收藏
        await deleteFavorite(currentSourceRef.current, currentIdRef.current);
        setFavorited(false);
      } else {
        // 如果未收藏，添加收藏
        await saveFavorite(currentSourceRef.current, currentIdRef.current, {
          title: videoTitleRef.current,
          source_name: detailRef.current?.source_name || '',
          year: detailRef.current?.year,
          cover: detailRef.current?.poster || '',
          total_episodes: detailRef.current?.episodes.length || 1,
          save_time: Date.now(),
          search_title: searchTitle,
        });
        setFavorited(true);
      }
    } catch (err) {
      console.error('切換收藏失敗:', err);
    }
  };

  useEffect(() => {
    if (
      !Artplayer ||
      !Hls ||
      !videoUrl ||
      loading ||
      currentEpisodeIndex === null ||
      !artRef.current
    ) {
      return;
    }

    // 確保選集索引有效
    if (
      !detail ||
      !detail.episodes ||
      currentEpisodeIndex >= detail.episodes.length ||
      currentEpisodeIndex < 0
    ) {
      setError(`選集索引無效，當前共 ${totalEpisodes} 集`);
      return;
    }

    if (!videoUrl) {
      setError('視頻地址無效');
      return;
    }
    console.log(videoUrl);

    // 檢測是否為WebKit瀏覽器
    const isWebkit =
      typeof window !== 'undefined' &&
      typeof (window as any).webkitConvertPointFromNodeToPage === 'function';

    // 非WebKit瀏覽器且播放器已存在，使用switch方法切換
    if (!isWebkit && artPlayerRef.current) {
      artPlayerRef.current.switch = videoUrl;
      artPlayerRef.current.title = `${videoTitle} - 第${
        currentEpisodeIndex + 1
      }集`;
      artPlayerRef.current.poster = processImageUrl(videoCover);
      if (artPlayerRef.current?.video) {
        ensureVideoSource(
          artPlayerRef.current.video as HTMLVideoElement,
          videoUrl
        );
      }
      return;
    }

    // WebKit瀏覽器或首次創建：銷燬之前的播放器實例並創建新的
    if (artPlayerRef.current) {
      cleanupPlayer();
    }

    try {
      // 創建新的播放器實例
      Artplayer.PLAYBACK_RATE = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
      Artplayer.USE_RAF = false;
      Artplayer.FULLSCREEN_WEB_IN_BODY = true;

      artPlayerRef.current = new Artplayer({
        container: artRef.current,
        url: videoUrl,
        poster: processImageUrl(videoCover),
        volume: 0.7,
        isLive: false,
        muted: false,
        autoplay: true,
        pip: true,
        autoSize: false,
        autoMini: false,
        screenshot: false,
        setting: true,
        loop: false,
        flip: false,
        playbackRate: true,
        aspectRatio: false,
        fullscreen: true,
        fullscreenWeb: true,
        subtitleOffset: false,
        miniProgressBar: false,
        mutex: true,
        playsInline: true,
        autoPlayback: false,
        airplay: true,
        theme: '#ff3e6c',
        lang: 'zh-cn',
        hotkey: false,
        fastForward: true,
        autoOrientation: true,
        lock: true,
        moreVideoAttr: {
          crossOrigin: 'anonymous',
        },
        // HLS 支持配置
        customType: {
          m3u8: function (video: HTMLVideoElement, url: string) {
            if (!Hls) {
              console.error('HLS.js 未加載');
              return;
            }

            if (video.hls) {
              video.hls.destroy();
            }
            const hls = new Hls({
              debug: false, // 關閉日誌
              enableWorker: true, // WebWorker 解碼，降低主線程壓力
              lowLatencyMode: true, // 開啟低延遲 LL-HLS

              /* 緩衝/內存相關 */
              maxBufferLength: 30, // 前向緩衝最大 30s，過大容易導致高延遲
              backBufferLength: 30, // 僅保留 30s 已播放內容，避免內存佔用
              maxBufferSize: 60 * 1000 * 1000, // 約 60MB，超出後觸發清理

              /* 自定義loader */
              loader: blockAdEnabledRef.current
                ? CustomHlsJsLoader
                : Hls.DefaultConfig.loader,
            });

            hls.loadSource(url);
            hls.attachMedia(video);
            video.hls = hls;

            ensureVideoSource(video, url);

            hls.on(Hls.Events.ERROR, function (event: any, data: any) {
              console.error('HLS Error:', event, data);
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log('網路錯誤，嘗試恢復...');
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log('媒體錯誤，嘗試恢復...');
                    hls.recoverMediaError();
                    break;
                  default:
                    console.log('無法恢復的錯誤');
                    hls.destroy();
                    break;
                }
              }
            });
          },
        },
        icons: {
          loading:
            '<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cGF0aCBkPSJNMjUuMjUxIDYuNDYxYy0xMC4zMTggMC0xOC42ODMgOC4zNjUtMTguNjgzIDE4LjY4M2g0LjA2OGMwLTguMDcgNi41NDUtMTQuNjE1IDE0LjYxNS0xNC42MTVWNi40NjF6IiBmaWxsPSIjMDA5Njg4Ij48YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIGF0dHJpYnV0ZVR5cGU9IlhNTCIgZHVyPSIxcyIgZnJvbT0iMCAyNSAyNSIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIHRvPSIzNjAgMjUgMjUiIHR5cGU9InJvdGF0ZSIvPjwvcGF0aD48L3N2Zz4=">',
        },
        settings: [
          {
            html: '去廣告',
            icon: '<text x="50%" y="50%" font-size="20" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#ffffff">AD</text>',
            tooltip: blockAdEnabled ? '已開啟' : '已關閉',
            onClick() {
              const newVal = !blockAdEnabled;
              try {
                localStorage.setItem('enable_blockad', String(newVal));
                if (artPlayerRef.current) {
                  resumeTimeRef.current = artPlayerRef.current.currentTime;
                  if (
                    artPlayerRef.current.video &&
                    artPlayerRef.current.video.hls
                  ) {
                    artPlayerRef.current.video.hls.destroy();
                  }
                  artPlayerRef.current.destroy();
                  artPlayerRef.current = null;
                }
                setBlockAdEnabled(newVal);
              } catch (_) {
                // ignore
              }
              return newVal ? '當前開啟' : '當前關閉';
            },
          },
          {
            name: '跳過片頭片尾',
            html: '跳過片頭片尾',
            switch: skipConfigRef.current.enable,
            onSwitch: function (item) {
              const newConfig = {
                ...skipConfigRef.current,
                enable: !item.switch,
              };
              handleSkipConfigChange(newConfig);
              return !item.switch;
            },
          },
          {
            html: '刪除跳過配置',
            onClick: function () {
              handleSkipConfigChange({
                enable: false,
                intro_time: 0,
                outro_time: 0,
              });
              return '';
            },
          },
          {
            name: '設置片頭',
            html: '設置片頭',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="12" r="2" fill="#ffffff"/><path d="M9 12L17 12" stroke="#ffffff" stroke-width="2"/><path d="M17 6L17 18" stroke="#ffffff" stroke-width="2"/></svg>',
            tooltip:
              skipConfigRef.current.intro_time === 0
                ? '設置片頭時間'
                : `${formatTime(skipConfigRef.current.intro_time)}`,
            onClick: function () {
              const currentTime = artPlayerRef.current?.currentTime || 0;
              if (currentTime > 0) {
                const newConfig = {
                  ...skipConfigRef.current,
                  intro_time: currentTime,
                };
                handleSkipConfigChange(newConfig);
                return `${formatTime(currentTime)}`;
              }
            },
          },
          {
            name: '設置片尾',
            html: '設置片尾',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 6L7 18" stroke="#ffffff" stroke-width="2"/><path d="M7 12L15 12" stroke="#ffffff" stroke-width="2"/><circle cx="19" cy="12" r="2" fill="#ffffff"/></svg>',
            tooltip:
              skipConfigRef.current.outro_time >= 0
                ? '設置片尾時間'
                : `-${formatTime(-skipConfigRef.current.outro_time)}`,
            onClick: function () {
              const outroTime =
                -(
                  artPlayerRef.current?.duration -
                  artPlayerRef.current?.currentTime
                ) || 0;
              if (outroTime < 0) {
                const newConfig = {
                  ...skipConfigRef.current,
                  outro_time: outroTime,
                };
                handleSkipConfigChange(newConfig);
                return `-${formatTime(-outroTime)}`;
              }
            },
          },
        ],
        // 控製欄配置
        controls: [
          {
            position: 'left',
            index: 13,
            html: '<i class="art-icon flex"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor"/></svg></i>',
            tooltip: '播放下一集',
            click: function () {
              handleNextEpisode();
            },
          },
        ],
      });

      // 監聽播放器事件
      artPlayerRef.current.on('ready', () => {
        setError(null);

        // 播放器就緒後，如果正在播放則請求 Wake Lock
        if (artPlayerRef.current && !artPlayerRef.current.paused) {
          requestWakeLock();
        }
      });

      // 監聽播放狀態變化，控製 Wake Lock
      artPlayerRef.current.on('play', () => {
        requestWakeLock();
      });

      artPlayerRef.current.on('pause', () => {
        releaseWakeLock();
        saveCurrentPlayProgress();
      });

      artPlayerRef.current.on('video:ended', () => {
        releaseWakeLock();
      });

      // 如果播放器初始化時已經在播放狀態，則請求 Wake Lock
      if (artPlayerRef.current && !artPlayerRef.current.paused) {
        requestWakeLock();
      }

      artPlayerRef.current.on('video:volumechange', () => {
        lastVolumeRef.current = artPlayerRef.current.volume;
      });
      artPlayerRef.current.on('video:ratechange', () => {
        lastPlaybackRateRef.current = artPlayerRef.current.playbackRate;
      });
      const onPiPChange = () => {
        setIsPiP(!!document.pictureInPictureElement);
      };
      const pipVideoEl = artPlayerRef.current?.video;
      if (pipVideoEl) {
        pipVideoEl.addEventListener('enterpictureinpicture', onPiPChange);
        pipVideoEl.addEventListener('leavepictureinpicture', onPiPChange);
      }

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
          const active = document.activeElement?.tagName;
          if (active === 'INPUT' || active === 'TEXTAREA') return;
          (async () => {
            try {
              if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPiP(false);
              } else if (artPlayerRef.current?.video) {
                await artPlayerRef.current.video.requestPictureInPicture();
                setIsPiP(true);
              }
            } catch {
              setIsPiP(false);
            }
          })();
        }
      };
      document.addEventListener('keydown', onKeyDown);
      pipKeyHandlerRef.current = onKeyDown;

      // 監聽視頻可播放事件，這時恢復播放進度更可靠
      artPlayerRef.current.on('video:canplay', () => {
        // 若存在需要恢復的播放進度，則跳轉
        if (resumeTimeRef.current && resumeTimeRef.current > 0) {
          try {
            const duration = artPlayerRef.current.duration || 0;
            let target = resumeTimeRef.current;
            if (duration && target >= duration - 2) {
              target = Math.max(0, duration - 5);
            }
            artPlayerRef.current.currentTime = target;
            console.log('成功恢復播放進度到:', resumeTimeRef.current);
          } catch (err) {
            console.warn('恢復播放進度失敗:', err);
          }
        }
        resumeTimeRef.current = null;

        setTimeout(() => {
          if (
            Math.abs(artPlayerRef.current.volume - lastVolumeRef.current) > 0.01
          ) {
            artPlayerRef.current.volume = lastVolumeRef.current;
          }
          if (
            Math.abs(
              artPlayerRef.current.playbackRate - lastPlaybackRateRef.current
            ) > 0.01 &&
            isWebkit
          ) {
            artPlayerRef.current.playbackRate = lastPlaybackRateRef.current;
          }
          artPlayerRef.current.notice.show = '';
        }, 0);

        // 隱藏換源加載狀態
        setIsVideoLoading(false);
      });

      // 監聽視頻時間更新事件，實現跳過片頭片尾
      artPlayerRef.current.on('video:timeupdate', () => {
        if (!skipConfigRef.current.enable) return;

        const currentTime = artPlayerRef.current.currentTime || 0;
        const duration = artPlayerRef.current.duration || 0;
        const now = Date.now();

        // 限製跳過檢查頻率為1.5秒一次
        if (now - lastSkipCheckRef.current < 1500) return;
        lastSkipCheckRef.current = now;

        // 跳過片頭
        if (
          skipConfigRef.current.intro_time > 0 &&
          currentTime < skipConfigRef.current.intro_time
        ) {
          artPlayerRef.current.currentTime = skipConfigRef.current.intro_time;
          artPlayerRef.current.notice.show = `已跳過片頭 (${formatTime(
            skipConfigRef.current.intro_time
          )})`;
        }

        // 跳過片尾
        if (
          skipConfigRef.current.outro_time < 0 &&
          duration > 0 &&
          currentTime >
            artPlayerRef.current.duration + skipConfigRef.current.outro_time
        ) {
          if (
            currentEpisodeIndexRef.current <
            (detailRef.current?.episodes?.length || 1) - 1
          ) {
            handleNextEpisode();
          } else {
            artPlayerRef.current.pause();
          }
          artPlayerRef.current.notice.show = `已跳過片尾 (${formatTime(
            skipConfigRef.current.outro_time
          )})`;
        }
      });

      artPlayerRef.current.on('error', (err: any) => {
        console.error('播放器錯誤:', err);
        if (artPlayerRef.current.currentTime > 0) {
          return;
        }
      });

      // 監聽視頻播放結束事件，自動播放下一集
      artPlayerRef.current.on('video:ended', () => {
        const d = detailRef.current;
        const idx = currentEpisodeIndexRef.current;
        if (
          d &&
          d.episodes &&
          idx < d.episodes.length - 1 &&
          autoNextRef.current
        ) {
          setTimeout(() => {
            setCurrentEpisodeIndex(idx + 1);
          }, 2000);
        }
      });

      artPlayerRef.current.on('video:timeupdate', () => {
        const now = Date.now();
        let interval = 5000;
        if (process.env.NEXT_PUBLIC_STORAGE_TYPE === 'upstash') {
          interval = 20000;
        }
        if (now - lastSaveTimeRef.current > interval) {
          saveCurrentPlayProgress();
          lastSaveTimeRef.current = now;
        }
      });

      artPlayerRef.current.on('pause', () => {
        saveCurrentPlayProgress();
      });

      if (artPlayerRef.current?.video) {
        ensureVideoSource(
          artPlayerRef.current.video as HTMLVideoElement,
          videoUrl
        );
      }
    } catch (err) {
      console.error('創建播放器失敗:', err);
      setError('播放器初始化失敗');
    }
  }, [Artplayer, Hls, videoUrl, loading, blockAdEnabled]);

  // 當組件解除安裝時清理定時器、Wake Lock 和播放器資源
  useEffect(() => {
    return () => {
      if (pipKeyHandlerRef.current) {
        document.removeEventListener('keydown', pipKeyHandlerRef.current);
      }

      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }

      releaseWakeLock();

      cleanupPlayer();
    };
  }, []);

  if (loading) {
    return (
      <PageLayout activePath='/play'>
        <div className='flex items-center justify-center min-h-screen bg-transparent'>
          <div className='text-center max-w-md mx-auto px-6'>
            {/* 動畫影院圖標 */}
            <div className='relative mb-8'>
              <div className='relative mx-auto w-24 h-24 bg-gradient-to-r from-[#ff3e6c] to-[#cc3256] rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300'>
                <div className='text-white text-4xl'>
                  {loadingStage === 'searching' && '🔍'}
                  {loadingStage === 'preferring' && '⚡'}
                  {loadingStage === 'fetching' && '🎬'}
                  {loadingStage === 'ready' && '✨'}
                </div>
                {/* 旋轉光環 */}
                <div className='absolute -inset-2 bg-gradient-to-r from-[#ff3e6c] to-[#cc3256] rounded-2xl opacity-20 animate-spin'></div>
              </div>

              {/* 浮動粒子效果 */}
              <div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
                <div className='absolute top-2 left-2 w-2 h-2 bg-[#ff3e6c] rounded-full animate-bounce'></div>
                <div
                  className='absolute top-4 right-4 w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce'
                  style={{ animationDelay: '0.5s' }}
                ></div>
                <div
                  className='absolute bottom-3 left-6 w-1 h-1 bg-red-300 rounded-full animate-bounce'
                  style={{ animationDelay: '1s' }}
                ></div>
              </div>
            </div>

            {/* 進度指示器 */}
            <div className='mb-6 w-64 sm:w-80 mx-auto'>
              <div className='flex justify-center space-x-2 mb-4'>
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    loadingStage === 'searching' || loadingStage === 'fetching'
                      ? 'bg-[#ff3e6c] scale-125'
                      : loadingStage === 'preferring' ||
                        loadingStage === 'ready'
                      ? 'bg-[#ff3e6c]'
                      : 'bg-gray-300'
                  }`}
                ></div>
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    loadingStage === 'preferring'
                      ? 'bg-[#ff3e6c] scale-125'
                      : loadingStage === 'ready'
                      ? 'bg-[#ff3e6c]'
                      : 'bg-gray-300'
                  }`}
                ></div>
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    loadingStage === 'ready'
                      ? 'bg-[#ff3e6c] scale-125'
                      : 'bg-gray-300'
                  }`}
                ></div>
              </div>

              {/* 進度條 */}
              <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden'>
                <div
                  className='h-full bg-gradient-to-r from-[#ff3e6c] to-[#cc3256] rounded-full transition-all duration-1000 ease-out'
                  style={{
                    width:
                      loadingStage === 'searching' ||
                      loadingStage === 'fetching'
                        ? '33%'
                        : loadingStage === 'preferring'
                        ? '66%'
                        : '100%',
                  }}
                ></div>
              </div>
            </div>

            {/* 加載消息 */}
            <div className='space-y-2'>
              <p className='text-xl font-semibold text-gray-800 dark:text-gray-200 animate-pulse'>
                {loadingMessage}
              </p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout activePath='/play'>
        <div className='flex items-center justify-center min-h-screen bg-transparent'>
          <div className='text-center max-w-md mx-auto px-6'>
            {/* 錯誤圖標 */}
            <div className='relative mb-8'>
              <div className='relative mx-auto w-24 h-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300'>
                <div className='text-white text-4xl'>😵</div>
                {/* 脈衝效果 */}
                <div className='absolute -inset-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl opacity-20 animate-pulse'></div>
              </div>

              {/* 浮動錯誤粒子 */}
              <div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
                <div className='absolute top-2 left-2 w-2 h-2 bg-red-400 rounded-full animate-bounce'></div>
                <div
                  className='absolute top-4 right-4 w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce'
                  style={{ animationDelay: '0.5s' }}
                ></div>
                <div
                  className='absolute bottom-3 left-6 w-1 h-1 bg-yellow-400 rounded-full animate-bounce'
                  style={{ animationDelay: '1s' }}
                ></div>
              </div>
            </div>

            {/* 錯誤信息 */}
            <div className='space-y-4 mb-8'>
              <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
                哎呀，出現了一些問題
              </h2>
              <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
                <p className='text-red-600 dark:text-red-400 font-medium'>
                  {error}
                </p>
              </div>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                請檢查網路連接或嘗試刷新頁面
              </p>
            </div>

            {/* 操作按鈕 */}
            <div className='space-y-3'>
              <button
                onClick={() =>
                  videoTitle
                    ? router.push(`/search?q=${encodeURIComponent(videoTitle)}`)
                    : router.back()
                }
                className='w-full px-6 py-3 bg-[#ff3e6c] text-white rounded-xl font-medium hover:bg-[#cc3256] transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl'
              >
                {videoTitle ? '🔍 返回搜索' : '← 返回上頁'}
              </button>

              <button
                onClick={() => window.location.reload()}
                className='w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200'
              >
                🔄 重新嘗試
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activePath='/play'>
      <div className='flex flex-col gap-3 py-4 px-5 lg:px-[3rem] 2xl:px-20'>
        {/* 第一行：影片標題 */}
        <div className='py-1'>
          <h1 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            {videoTitle || '影片標題'}
            {totalEpisodes > 1 && (
              <span className='text-gray-500 dark:text-gray-400'>
                {` > ${
                  detail?.episodes_titles?.[currentEpisodeIndex] ||
                  `第 ${currentEpisodeIndex + 1} 集`
                }`}
              </span>
            )}
          </h1>
        </div>
        {/* 第二行：播放器和選集 */}
        <div className='space-y-2'>
          {/* 摺疊控製 - 僅在 lg 及以上熒幕顯示 */}
          <div className='hidden lg:flex justify-end'>
            <button
              onClick={() =>
                setIsEpisodeSelectorCollapsed(!isEpisodeSelectorCollapsed)
              }
              className='group relative flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200'
              title={
                isEpisodeSelectorCollapsed ? '顯示選集面板' : '隱藏選集面板'
              }
            >
              <svg
                className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                  isEpisodeSelectorCollapsed ? 'rotate-180' : 'rotate-0'
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M9 5l7 7-7 7'
                />
              </svg>
              <span className='text-xs font-medium text-gray-600 dark:text-gray-300'>
                {isEpisodeSelectorCollapsed ? '顯示' : '隱藏'}
              </span>

              {/* 精緻的狀態指示點 */}
              <div
                className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full transition-all duration-200 ${
                  isEpisodeSelectorCollapsed
                    ? 'bg-orange-400 animate-pulse'
                    : 'bg-[#ff3e6c]'
                }`}
              ></div>
            </button>
          </div>

          <div
            className={`grid gap-4 lg:h-[500px] xl:h-[650px] 2xl:h-[750px] transition-all duration-300 ease-in-out ${
              isEpisodeSelectorCollapsed
                ? 'grid-cols-1'
                : 'grid-cols-1 md:grid-cols-4'
            }`}
          >
            {/* 播放器 */}
            <div
              className={`h-full transition-all duration-300 ease-in-out rounded-xl border border-white/0 dark:border-white/30 ${
                isEpisodeSelectorCollapsed ? 'col-span-1' : 'md:col-span-3'
              }`}
            >
              <div className='relative w-full h-[300px] lg:h-full group'>
                <div
                  ref={artRef}
                  className='bg-black w-full h-full rounded-xl overflow-hidden shadow-lg'
                ></div>

                {/* 換源加載蒙層 */}
                {isVideoLoading && (
                  <div className='absolute inset-0 bg-black/85 backdrop-blur-sm rounded-xl flex items-center justify-center z-[500] transition-all duration-300'>
                    <div className='text-center max-w-md mx-auto px-6'>
                      {/* 動畫影院圖標 */}
                      <div className='relative mb-8'>
                        <div className='relative mx-auto w-24 h-24 bg-gradient-to-r from-[#ff3e6c] to-[#cc3256] rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300'>
                          <div className='text-white text-4xl'>🎬</div>
                          {/* 旋轉光環 */}
                          <div className='absolute -inset-2 bg-gradient-to-r from-[#ff3e6c] to-[#cc3256] rounded-2xl opacity-20 animate-spin'></div>
                        </div>

                        {/* 浮動粒子效果 */}
                        <div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
                          <div className='absolute top-2 left-2 w-2 h-2 bg-[#ff3e6c] rounded-full animate-bounce'></div>
                          <div
                            className='absolute top-4 right-4 w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce'
                            style={{ animationDelay: '0.5s' }}
                          ></div>
                          <div
                            className='absolute bottom-3 left-6 w-1 h-1 bg-red-300 rounded-full animate-bounce'
                            style={{ animationDelay: '1s' }}
                          ></div>
                        </div>
                      </div>

                      {/* 換源消息 */}
                      <div className='space-y-2'>
                        <p className='text-xl font-semibold text-white animate-pulse'>
                          {videoLoadingStage === 'sourceChanging'
                            ? '🔄 切換播放源...'
                            : '🔄 視頻加載中...'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 選集和換源 - 在移動端始終顯示，在 lg 及以上可摺疊 */}
            <div
              className={`h-[300px] lg:h-full md:overflow-hidden transition-all duration-300 ease-in-out ${
                isEpisodeSelectorCollapsed
                  ? 'md:col-span-1 lg:hidden lg:opacity-0 lg:scale-95'
                  : 'md:col-span-1 lg:opacity-100 lg:scale-100'
              }`}
            >
              <EpisodeSelector
                totalEpisodes={totalEpisodes}
                episodes_titles={detail?.episodes_titles || []}
                value={currentEpisodeIndex + 1}
                onChange={handleEpisodeChange}
                onSourceChange={handleSourceChange}
                currentSource={currentSource}
                currentId={currentId}
                videoTitle={searchTitle || videoTitle}
                availableSources={availableSources}
                sourceSearchLoading={sourceSearchLoading}
                sourceSearchError={sourceSearchError}
                precomputedVideoInfo={precomputedVideoInfo}
              />
              {/* 自動連播 + 快捷鍵幫助 */}
              <div className='flex items-center justify-between px-3 py-2 mt-2 bg-black/40 dark:bg-white/5 rounded-lg border border-white/5'>
                <label className='flex items-center gap-2 cursor-pointer select-none'>
                  <span className='text-xs text-zinc-400'>自動連播</span>
                  <div
                    className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${
                      autoNext ? 'bg-[#ff3e6c]' : 'bg-zinc-600'
                    }`}
                    onClick={() => {
                      const newVal = !autoNext;
                      setAutoNext(newVal);
                      localStorage.setItem('enable_autonext', String(newVal));
                    }}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                        autoNext ? 'translate-x-4' : ''
                      }`}
                    />
                  </div>
                </label>
                <button
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className='text-xs text-zinc-500 hover:text-zinc-300 transition-colors'
                >
                  快捷鍵 ?
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 快捷鍵幫助面板 */}
        {showShortcuts && (
          <div
            className='fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'
            onClick={() => setShowShortcuts(false)}
          >
            <div
              className='bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl'
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className='text-white font-bold text-lg mb-4'>快捷鍵幫助</h3>
              <div className='space-y-2.5 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-zinc-400'>空白鍵</span>
                  <span className='text-white'>播放 / 暫停</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-zinc-400'>F</span>
                  <span className='text-white'>切換全螢幕</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-zinc-400'>← / →</span>
                  <span className='text-white'>快退 / 快進 10 秒</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-zinc-400'>↑ / ↓</span>
                  <span className='text-white'>增減音量</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-zinc-400'>Alt + ← / →</span>
                  <span className='text-white'>上 / 下一集</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-zinc-400'>? / H</span>
                  <span className='text-white'>快捷鍵幫助</span>
                </div>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className='w-full mt-5 py-2.5 bg-[#ff3e6c] hover:bg-[#cc3256] text-white font-medium rounded-xl transition-colors text-sm'
              >
                關閉
              </button>
            </div>
          </div>
        )}

        {/* 詳情展示 */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {/* 文字區 */}
          <div className='md:col-span-3'>
            <div className='p-6 flex flex-col min-h-0'>
              {/* 標題 */}
              <h1 className='text-3xl font-bold mb-2 tracking-wide flex items-center flex-shrink-0 text-center md:text-left w-full'>
                {videoTitle || '影片標題'}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite();
                  }}
                  className='ml-3 flex-shrink-0 hover:opacity-80 transition-opacity'
                >
                  <FavoriteIcon filled={favorited} />
                </button>
              </h1>

              {/* 關鍵信息行 */}
              <div className='flex flex-wrap items-center gap-3 text-base mb-4 opacity-80 flex-shrink-0'>
                {detail?.class && (
                  <span className='text-[#ff3e6c] font-semibold'>
                    {detail.class}
                  </span>
                )}
                {(detail?.year || videoYear) && (
                  <span>{detail?.year || videoYear}</span>
                )}
                {detail?.source_name && (
                  <span className='border border-gray-500/60 px-2 py-[1px] rounded'>
                    {detail.source_name}
                  </span>
                )}
                {detail?.type_name && <span>{detail.type_name}</span>}
              </div>
              {/* 劇情簡介 */}
              {detail?.desc && (
                <div
                  className='mt-0 text-base leading-relaxed opacity-90 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-hide'
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {detail.desc}
                </div>
              )}
            </div>
          </div>

          {/* 封面展示 */}
          <div className='hidden md:block md:col-span-1 md:order-first'>
            <div className='pl-0 py-4 pr-6'>
              <div className='relative bg-gray-300 dark:bg-gray-700 aspect-[2/3] flex items-center justify-center rounded-xl overflow-hidden'>
                {videoCover ? (
                  <>
                    <img
                      src={processImageUrl(videoCover)}
                      alt={videoTitle}
                      className='w-full h-full object-cover'
                      referrerPolicy='no-referrer'
                    />

                    {/* 豆瓣鏈接按鈕 */}
                    {videoDoubanId !== 0 && (
                      <a
                        href={`https://movie.douban.com/subject/${videoDoubanId.toString()}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='absolute top-3 left-3'
                      >
                        <div className='bg-[#ff3e6c] text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-[#cc3256] hover:scale-[1.1] transition-all duration-300 ease-out'>
                          <svg
                            width='16'
                            height='16'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          >
                            <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'></path>
                            <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'></path>
                          </svg>
                        </div>
                      </a>
                    )}
                  </>
                ) : (
                  <span className='text-gray-600 dark:text-gray-400'>
                    封面圖片
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// FavoriteIcon 組件
const FavoriteIcon = ({ filled }: { filled: boolean }) => {
  if (filled) {
    return (
      <svg
        className='h-7 w-7'
        viewBox='0 0 24 24'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
          fill='#ff3e6c'
          stroke='#ff3e6c'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    );
  }
  return (
    <Heart className='h-7 w-7 stroke-[1] text-gray-600 dark:text-gray-300' />
  );
};

export default function PlayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayPageClient />
    </Suspense>
  );
}
