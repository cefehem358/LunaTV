/* eslint-disable @next/next/no-img-element */

import { useRouter } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { SearchResult } from '@/lib/types';
import { getVideoResolutionFromM3u8, processImageUrl } from '@/lib/utils';

interface VideoInfo {
  quality: string;
  loadSpeed: string;
  pingTime: number;
  hasError?: boolean;
}

interface EpisodeSelectorProps {
  totalEpisodes: number;
  episodes_titles: string[];
  episodesPerPage?: number;
  value?: number;
  onChange?: (episodeNumber: number) => void;
  onSourceChange?: (source: string, id: string, title: string) => void;
  currentSource?: string;
  currentId?: string;
  videoTitle?: string;
  videoYear?: string;
  availableSources?: SearchResult[];
  sourceSearchLoading?: boolean;
  sourceSearchError?: string | null;
  precomputedVideoInfo?: Map<string, VideoInfo>;
}

const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  totalEpisodes,
  episodes_titles,
  episodesPerPage = 50,
  value = 1,
  onChange,
  onSourceChange,
  currentSource,
  currentId,
  videoTitle,
  availableSources = [],
  sourceSearchLoading = false,
  sourceSearchError = null,
  precomputedVideoInfo,
}) => {
  const router = useRouter();
  const pageCount = Math.ceil(totalEpisodes / episodesPerPage);

  const [videoInfoMap, setVideoInfoMap] = useState<Map<string, VideoInfo>>(
    new Map()
  );
  const [attemptedSources, setAttemptedSources] = useState<Set<string>>(
    new Set()
  );

  const attemptedSourcesRef = useRef<Set<string>>(new Set());
  const videoInfoMapRef = useRef<Map<string, VideoInfo>>(new Map());

  useEffect(() => {
    attemptedSourcesRef.current = attemptedSources;
  }, [attemptedSources]);

  useEffect(() => {
    videoInfoMapRef.current = videoInfoMap;
  }, [videoInfoMap]);

  const [activeTab, setActiveTab] = useState<'episodes' | 'sources'>(
    totalEpisodes > 1 ? 'episodes' : 'sources'
  );

  const initialPage = Math.floor((value - 1) / episodesPerPage);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [descending, setDescending] = useState<boolean>(false);

  const displayPage = useMemo(() => {
    if (descending) {
      return pageCount - 1 - currentPage;
    }
    return currentPage;
  }, [currentPage, descending, pageCount]);

  const getVideoInfo = useCallback(async (source: SearchResult) => {
    const sourceKey = `${source.source}-${source.id}`;

    if (attemptedSourcesRef.current.has(sourceKey)) {
      return;
    }

    if (!source.episodes || source.episodes.length === 0) {
      return;
    }
    const episodeUrl =
      source.episodes.length > 1 ? source.episodes[1] : source.episodes[0];

    setAttemptedSources((prev) => new Set(prev).add(sourceKey));

    try {
      const info = await getVideoResolutionFromM3u8(episodeUrl);
      setVideoInfoMap((prev) => new Map(prev).set(sourceKey, info));
    } catch (error) {
      setVideoInfoMap((prev) =>
        new Map(prev).set(sourceKey, {
          quality: '錯誤',
          loadSpeed: '未知',
          pingTime: 0,
          hasError: true,
        })
      );
    }
  }, []);

  useEffect(() => {
    if (precomputedVideoInfo && precomputedVideoInfo.size > 0) {
      setVideoInfoMap((prev) => {
        const newMap = new Map(prev);
        precomputedVideoInfo.forEach((value, key) => {
          newMap.set(key, value);
        });
        return newMap;
      });

      setAttemptedSources((prev) => {
        const newSet = new Set(prev);
        precomputedVideoInfo.forEach((info, key) => {
          if (!info.hasError) {
            newSet.add(key);
          }
        });
        return newSet;
      });

      precomputedVideoInfo.forEach((info, key) => {
        if (!info.hasError) {
          attemptedSourcesRef.current.add(key);
        }
      });
    }
  }, [precomputedVideoInfo]);

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

  useEffect(() => {
    const fetchVideoInfosInBatches = async () => {
      if (
        !optimizationEnabled ||
        activeTab !== 'sources' ||
        availableSources.length === 0
      )
        return;

      const pendingSources = availableSources.filter((source) => {
        const sourceKey = `${source.source}-${source.id}`;
        return !attemptedSourcesRef.current.has(sourceKey);
      });

      if (pendingSources.length === 0) return;

      const batchSize = Math.ceil(pendingSources.length / 2);

      for (let start = 0; start < pendingSources.length; start += batchSize) {
        const batch = pendingSources.slice(start, start + batchSize);
        await Promise.all(batch.map(getVideoInfo));
      }
    };

    fetchVideoInfosInBatches();
  }, [activeTab, availableSources, getVideoInfo, optimizationEnabled]);

  const categoriesAsc = useMemo(() => {
    return Array.from({ length: pageCount }, (_, i) => {
      const start = i * episodesPerPage + 1;
      const end = Math.min(start + episodesPerPage - 1, totalEpisodes);
      return { start, end };
    });
  }, [pageCount, episodesPerPage, totalEpisodes]);

  const categories = useMemo(() => {
    if (descending) {
      return [...categoriesAsc]
        .reverse()
        .map(({ start, end }) => `${end}-${start}`);
    }
    return categoriesAsc.map(({ start, end }) => `${start}-${end}`);
  }, [categoriesAsc, descending]);

  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);

  const preventPageScroll = useCallback(
    (e: WheelEvent) => {
      if (isCategoryHovered) {
        e.preventDefault();
      }
    },
    [isCategoryHovered]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (isCategoryHovered && categoryContainerRef.current) {
        e.preventDefault();
        const container = categoryContainerRef.current;
        const scrollAmount = e.deltaY * 2;
        container.scrollBy({
          left: scrollAmount,
          behavior: 'smooth',
        });
      }
    },
    [isCategoryHovered]
  );

  useEffect(() => {
    if (isCategoryHovered) {
      document.addEventListener('wheel', preventPageScroll, { passive: false });
      document.addEventListener('wheel', handleWheel, { passive: false });
    } else {
      document.removeEventListener('wheel', preventPageScroll);
      document.removeEventListener('wheel', handleWheel);
    }

    return () => {
      document.removeEventListener('wheel', preventPageScroll);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [isCategoryHovered, preventPageScroll, handleWheel]);

  useEffect(() => {
    const btn = buttonRefs.current[displayPage];
    const container = categoryContainerRef.current;
    if (btn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const btnLeft = btnRect.left - containerRect.left + scrollLeft;
      const btnWidth = btnRect.width;
      const containerWidth = containerRect.width;
      const targetScrollLeft = btnLeft - (containerWidth - btnWidth) / 2;
      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      });
    }
  }, [displayPage, pageCount]);

  const handleSourceTabClick = () => {
    setActiveTab('sources');
  };

  const handleCategoryClick = useCallback(
    (index: number) => {
      if (descending) {
        setCurrentPage(pageCount - 1 - index);
      } else {
        setCurrentPage(index);
      }
    },
    [descending, pageCount]
  );

  const handleEpisodeClick = useCallback(
    (episodeNumber: number) => {
      onChange?.(episodeNumber);
    },
    [onChange]
  );

  const handleSourceClick = useCallback(
    (source: SearchResult) => {
      onSourceChange?.(source.source, source.id, source.title);
    },
    [onSourceChange]
  );

  const currentStart = currentPage * episodesPerPage + 1;
  const currentEnd = Math.min(
    currentStart + episodesPerPage - 1,
    totalEpisodes
  );

  return (
    <div className='h-full flex flex-col bg-[#141414] rounded-xl overflow-hidden border border-white/5'>
      {/* Netflix 风格 Tab 切换 */}
      <div className='flex flex-shrink-0 border-b border-white/10'>
        {totalEpisodes > 1 && (
          <button
            onClick={() => setActiveTab('episodes')}
            className={`flex-1 py-3 px-6 text-sm font-medium transition-all duration-200 ${
              activeTab === 'episodes'
                ? 'text-white bg-[#e50914]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            選集
          </button>
        )}
        <button
          onClick={handleSourceTabClick}
          className={`flex-1 py-3 px-6 text-sm font-medium transition-all duration-200 ${
            activeTab === 'sources'
              ? 'text-white bg-[#e50914]'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          換源
        </button>
      </div>

      {/* 選集 Tab 內容 - Netflix 風格 */}
      {activeTab === 'episodes' && (
        <div className='flex-1 overflow-hidden flex flex-col p-4'>
          {/* 分類標籤 */}
          <div className='flex items-center gap-3 mb-4 flex-shrink-0'>
            <div
              className='flex-1 overflow-x-auto scrollbar-hide'
              ref={categoryContainerRef}
              onMouseEnter={() => setIsCategoryHovered(true)}
              onMouseLeave={() => setIsCategoryHovered(false)}
            >
              <div className='flex gap-2 min-w-max'>
                {categories.map((label, idx) => {
                  const isActive = idx === displayPage;
                  return (
                    <button
                      key={label}
                      ref={(el) => {
                        buttonRefs.current[idx] = el;
                      }}
                      onClick={() => handleCategoryClick(idx)}
                      className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? 'bg-[#e50914] text-white shadow-lg'
                          : 'bg-white/10 text-zinc-300 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              className='flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-white transition-all duration-200'
              onClick={() => setDescending((prev) => !prev)}
              title={descending ? '切換為正序' : '切換為倒序'}
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  descending ? 'rotate-180' : ''
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12'
                />
              </svg>
            </button>
          </div>

          {/* 集數網格 - Netflix 風格圓角卡片 */}
          <div className='flex-1 overflow-y-auto scrollbar-hide'>
            <div className='grid grid-cols-8 gap-2'>
              {(() => {
                const len = currentEnd - currentStart + 1;
                const episodes = Array.from({ length: len }, (_, i) =>
                  descending ? currentEnd - i : currentStart + i
                );
                return episodes;
              })().map((episodeNumber) => {
                const isActive = episodeNumber === value;
                return (
                  <button
                    key={episodeNumber}
                    onClick={() => handleEpisodeClick(episodeNumber - 1)}
                    className={`aspect-square flex items-center justify-center text-sm font-bold rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-[#e50914] text-white scale-110 shadow-lg shadow-red-500/30'
                        : 'bg-white/10 text-zinc-300 hover:bg-white/20 hover:text-white hover:scale-105'
                    }`}
                  >
                    {(() => {
                      const title = episodes_titles?.[episodeNumber - 1];
                      if (!title) return episodeNumber;
                      const match = title.match(/(?:第)?(\d+)(?:集|話)/);
                      if (match) return match[1];
                      return episodeNumber;
                    })()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 換源 Tab 內容 - Netflix 風格卡片 */}
      {activeTab === 'sources' && (
        <div className='flex-1 overflow-hidden flex flex-col'>
          {sourceSearchLoading && (
            <div className='flex-1 flex items-center justify-center'>
              <div className='flex items-center gap-3'>
                <div className='w-6 h-6 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin' />
                <span className='text-zinc-400 text-sm'>搜索中...</span>
              </div>
            </div>
          )}

          {sourceSearchError && (
            <div className='flex-1 flex items-center justify-center'>
              <div className='text-center'>
                <div className='text-red-500 text-3xl mb-3'>⚠️</div>
                <p className='text-red-400 text-sm'>{sourceSearchError}</p>
              </div>
            </div>
          )}

          {!sourceSearchLoading &&
            !sourceSearchError &&
            availableSources.length === 0 && (
              <div className='flex-1 flex items-center justify-center'>
                <div className='text-center'>
                  <div className='text-zinc-600 text-4xl mb-3'>📺</div>
                  <p className='text-zinc-500 text-sm'>暫無可用的換源</p>
                </div>
              </div>
            )}

          {!sourceSearchLoading &&
            !sourceSearchError &&
            availableSources.length > 0 && (
              <div className='flex-1 overflow-y-auto p-3 space-y-2'>
                {availableSources
                  .sort((a, b) => {
                    const aIsCurrent =
                      a.source?.toString() === currentSource?.toString() &&
                      a.id?.toString() === currentId?.toString();
                    const bIsCurrent =
                      b.source?.toString() === currentSource?.toString() &&
                      b.id?.toString() === currentId?.toString();
                    if (aIsCurrent && !bIsCurrent) return -1;
                    if (!aIsCurrent && bIsCurrent) return 1;
                    return 0;
                  })
                  .map((source) => {
                    const isCurrentSource =
                      source.source?.toString() === currentSource?.toString() &&
                      source.id?.toString() === currentId?.toString();
                    const sourceKey = `${source.source}-${source.id}`;
                    const videoInfo = videoInfoMap.get(sourceKey);
                    return (
                      <div
                        key={sourceKey}
                        onClick={() =>
                          !isCurrentSource && handleSourceClick(source)
                        }
                        className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                          isCurrentSource
                            ? 'bg-[#e50914]/20 border border-[#e50914]/50'
                            : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10'
                        }`}
                      >
                        {/* 封面 */}
                        <div className='w-16 h-24 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0'>
                          {source.episodes && source.episodes.length > 0 && (
                            <img
                              src={processImageUrl(source.poster)}
                              alt={source.title}
                              className='w-full h-full object-cover'
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          )}
                        </div>

                        {/* 信息区域 */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between gap-2 mb-2'>
                            <h3 className='font-semibold text-white text-sm truncate leading-tight'>
                              {source.title}
                            </h3>
                            {videoInfo &&
                              videoInfo.quality !== '未知' &&
                              !videoInfo.hasError && (
                                <span
                                  className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold ${
                                    ['4K', '2K'].includes(videoInfo.quality)
                                      ? 'bg-purple-500/20 text-purple-400'
                                      : ['1080p', '720p'].includes(
                                          videoInfo.quality
                                        )
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-yellow-500/20 text-yellow-400'
                                  }`}
                                >
                                  {videoInfo.quality}
                                </span>
                              )}
                            {videoInfo?.hasError && (
                              <span className='flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400'>
                                檢測失敗
                              </span>
                            )}
                          </div>

                          <div className='flex items-center gap-2 mb-1'>
                            <span className='text-xs px-2 py-0.5 bg-white/10 text-zinc-300 rounded'>
                              {source.source_name}
                            </span>
                            {source.episodes.length > 1 && (
                              <span className='text-xs text-zinc-500'>
                                {source.episodes.length} 集
                              </span>
                            )}
                          </div>

                          {videoInfo && !videoInfo.hasError && (
                            <div className='flex items-center gap-3 text-xs'>
                              <span className='text-green-400 font-medium'>
                                {videoInfo.loadSpeed}
                              </span>
                              <span className='text-orange-400 font-medium'>
                                {videoInfo.pingTime}ms
                              </span>
                            </div>
                          )}
                          {isCurrentSource && (
                            <div className='absolute top-2 right-2'>
                              <span className='px-2 py-0.5 bg-[#e50914] text-white text-xs font-bold rounded'>
                                當前
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                <button
                  onClick={() => {
                    if (videoTitle) {
                      router.push(
                        `/search?q=${encodeURIComponent(videoTitle)}`
                      );
                    }
                  }}
                  className='w-full text-center text-xs text-zinc-500 hover:text-[#e50914] transition-colors py-3 border-t border-white/5 mt-2'
                >
                  影片匹配有误？点击去搜索
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default EpisodeSelector;
