'use client';

import {
  BookMarked,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Clapperboard,
  Film,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Tv,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  BangumiCalendarData,
  GetBangumiCalendarData,
} from '@/lib/bangumi.client';
import type { PlayRecord } from '@/lib/db.client';
import {
  clearAllFavorites,
  getAllFavorites,
  getAllPlayRecords,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { getDoubanCategories } from '@/lib/douban.client';
import {
  type FavoriteTag,
  getAllItemTags,
  getFavoriteTags,
  saveFavoriteTags,
  setItemTags,
} from '@/lib/favorite-tags.client';
import { DoubanItem } from '@/lib/types';
import { processImageUrl } from '@/lib/utils';

import MobileBottomNav from '@/components/MobileBottomNav';
import Sidebar from '@/components/Sidebar';
import { useSite } from '@/components/SiteProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/UserMenu';
import VideoCard from '@/components/VideoCard';

export default function NetflixHome({
  hotMovies = [],
  hotTvShows = [],
  hotVarietyShows = [],
  bangumiData = [],
  playRecords = [],
}: {
  hotMovies?: DoubanItem[];
  hotTvShows?: DoubanItem[];
  hotVarietyShows?: DoubanItem[];
  bangumiData?: BangumiCalendarData[];
  playRecords?: (PlayRecord & { key: string })[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab');
  const { announcement } = useSite();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState<'home' | 'favorites'>('home');
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    if (tab === 'favorites') {
      setActiveNav('favorites');
    } else {
      setActiveNav('home');
    }
  }, [tab]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (announcement) {
      const hasSeen = localStorage.getItem('hasSeenAnnouncement');
      if (hasSeen !== announcement) setShowAnnouncement(true);
    }
  }, [announcement]);

  const handleCloseAnnouncement = useCallback((text: string) => {
    setShowAnnouncement(false);
    localStorage.setItem('hasSeenAnnouncement', text);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim())
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const continueRef = useRef<HTMLDivElement>(null);
  const scrollRow = (
    ref: React.RefObject<HTMLDivElement>,
    dir: 'left' | 'right'
  ) => {
    ref.current?.scrollBy({
      left: dir === 'left' ? -400 : 400,
      behavior: 'smooth',
    });
  };

  return (
    <div className='min-h-screen bg-transparent text-zinc-900 dark:text-zinc-100'>
      <div className='hidden md:block'>
        <Sidebar activePath='/' />
      </div>

      <div className='pl-0 md:pl-24'>
        {/* ========== B. 頂部毛玻璃搜尋列 ========== */}
        <header
          className={`sticky top-0 z-40 h-16 md:h-20 flex items-center justify-between px-4 md:px-8 transition-all duration-300 ${
            isScrolled
              ? 'bg-white/80 dark:bg-[#040404]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5'
              : 'bg-transparent'
          }`}
        >
          <form onSubmit={handleSearch} className='flex-1 max-w-2xl'>
            <div className='relative'>
              <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400' />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='搜尋電影、電視劇、動漫...'
                className='w-full md:w-96 h-11 pl-12 pr-4 bg-zinc-100 dark:bg-zinc-900/80 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 border border-zinc-200 dark:border-transparent focus:border-[#ff3e6c] focus:outline-none transition-all duration-200'
              />
            </div>
          </form>
          <div className='flex items-center gap-3 md:gap-6 ml-4 md:ml-0'>
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        {/* ========== 主頁內容 ========== */}
        <main
          className='px-4 md:px-6'
          style={{
            paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))',
          }}
        >
          {activeNav === 'home' ? (
            <>
              {/* 繼續觀看 */}
              {playRecords.length > 0 && (
                <section className='mb-8'>
                  <div className='flex items-center gap-3 mb-4'>
                    <CirclePlay className='w-5 h-5 text-[#ff3e6c]' />
                <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                  ⏳ 繼續觀看
                </h3>
                  </div>
                  <div className='relative group'>
                    <button
                      onClick={() =>
                        scrollRow(
                          continueRef as React.RefObject<HTMLDivElement>,
                          'left'
                        )
                      }
                      className='absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80'
                    >
                      <ChevronLeft className='w-5 h-5 text-white' />
                    </button>
                    <button
                      onClick={() =>
                        scrollRow(
                          continueRef as React.RefObject<HTMLDivElement>,
                          'right'
                        )
                      }
                      className='absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80'
                    >
                      <ChevronRight className='w-5 h-5 text-white' />
                    </button>
                    <div
                      ref={continueRef}
                      className='flex gap-3 overflow-x-auto scrollbar-hide pb-2'
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                      }}
                    >
                      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
                      {playRecords.map((record) => {
                        const [source, id] = record.key.split('+');
                        const progress =
                          record.total_time > 0
                            ? (record.play_time / record.total_time) * 100
                            : 0;
                        return (
                          <button
                            key={record.key}
                            onClick={() =>
                              router.push(
                                `/play?id=${id}&source=${source}&title=${encodeURIComponent(
                                  record.title
                                )}${
                                  record.search_title
                                    ? `&stitle=${encodeURIComponent(
                                        record.search_title
                                      )}`
                                    : ''
                                }`
                              )
                            }
                            className='focus-glow-card glass-panel w-56 shrink-0 rounded-2xl overflow-hidden cursor-pointer'
                          >
                            <div className='relative aspect-video bg-gray-800'>
                              <Image
                                src={
                                  processImageUrl(record.cover) ||
                                  '/placeholder.jpg'
                                }
                                alt={record.title}
                                fill
                                className='object-cover'
                                unoptimized
                                referrerPolicy='no-referrer'
                              />
                              <div className='absolute bottom-0 left-0 right-0 h-1 bg-zinc-700'>
                                <div
                                  className='h-full glow-bar transition-all'
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                            <div className='p-3'>
                              <p className='text-sm font-medium text-white truncate'>
                                {record.title}
                              </p>
                              <p className='text-xs text-zinc-400 mt-1'>
                                看到第 {record.index} 集 ({Math.round(progress)}%)
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* 最新上架網格 */}
              <section className='mb-10'>
                <SectionTitle
                  title='最新上架'
                  icon={<Clapperboard className='w-5 h-5 text-[#ff3e6c]' />}
                  viewAllHref='/douban?type=movie'
                />
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4'>
                  {[...hotMovies, ...hotTvShows]
                    .slice(0, 14)
                    .map((item, idx) => (
                      <NetflixGridCard key={`${item.id}-${idx}`} item={item} />
                    ))}
                </div>
              </section>

              {/* 熱門電影 */}
              <NetflixSectionRow
                title='熱門電影'
                icon={<Film className='w-5 h-5 text-[#ff3e6c]' />}
                items={hotMovies}
                viewAllHref='/douban?type=movie'
                scrollRow={scrollRow}
              />

              {/* 熱門劇集 */}
              <NetflixSectionRow
                title='熱門劇集'
                icon={<Tv className='w-5 h-5 text-[#ff3e6c]' />}
                items={hotTvShows}
                viewAllHref='/douban?type=tv'
                scrollRow={scrollRow}
              />

              {/* 新番放送（今日） */}
              <NetflixBangumiRow
                bangumiData={bangumiData}
                scrollRow={scrollRow}
              />

              {/* 熱門綜藝 */}
              <NetflixSectionRow
                title='熱門綜藝'
                icon={<Star className='w-5 h-5 text-[#ff3e6c]' />}
                items={hotVarietyShows}
                viewAllHref='/douban?type=show'
                scrollRow={scrollRow}
              />
            </>
          ) : (
            /* ========== 收藏夾視圖 ========== */
            <FavoritesView />
          )}
        </main>
      </div>

      {/* ========== 公告彈窗 ========== */}
      {announcement && showAnnouncement && (
        <div
          className='fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4'
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className='w-full max-w-md rounded-2xl bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/10 p-8 shadow-2xl'>
            <div className='flex items-start justify-between mb-6'>
              <div>
                <h3 className='text-xl font-bold text-zinc-900 dark:text-white mb-1'>
                  系統公告
                </h3>
                <div className='w-8 h-1 bg-[#ff3e6c] rounded-full' />
              </div>
              <button
                onClick={() => handleCloseAnnouncement(announcement)}
                className='p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors'
              >
                <X className='w-5 h-5' />
              </button>
            </div>
            <div className='mb-8'>
              <div className='bg-zinc-50 dark:bg-[#141414] rounded-xl p-5 border-l-4 border-[#ff3e6c]'>
                <p className='text-zinc-650 dark:text-zinc-300 leading-relaxed'>
                  {announcement}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleCloseAnnouncement(announcement)}
              className='w-full py-3 bg-[#ff3e6c] hover:bg-[#ff557e] text-white font-bold rounded-xl transition-colors'
            >
              確定
            </button>
          </div>
        </div>
      )}
      {/* 移動端底部導航 */}
      <div className='md:hidden'>
        <MobileBottomNav
          activePath={activeNav === 'favorites' ? '/?tab=favorites' : '/'}
        />
      </div>
    </div>
  );
}

/* ========== 內部子元件 ========== */

function SectionTitle({
  title,
  icon,
  viewAllHref,
}: {
  title: string;
  icon: React.ReactNode;
  viewAllHref?: string;
}) {
  return (
    <div className='flex items-center justify-between mb-5'>
      <div className='flex items-center gap-3'>
        {icon}
        <h3 className='text-xl font-bold text-zinc-900 dark:text-white'>
          {title}
        </h3>
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className='flex items-center text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors gap-1'
        >
          查看更多 <ChevronRight className='w-4 h-4' />
        </Link>
      )}
    </div>
  );
}

function NetflixSectionRow({
  title,
  icon,
  items,
  viewAllHref,
  scrollRow,
}: {
  title: string;
  icon: React.ReactNode;
  items: DoubanItem[];
  viewAllHref?: string;
  scrollRow: (
    ref: React.RefObject<HTMLDivElement>,
    dir: 'left' | 'right'
  ) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  return (
    <section className='mb-10'>
      <SectionTitle title={title} icon={icon} viewAllHref={viewAllHref} />
      <div className='relative group'>
        <button
          onClick={() =>
            scrollRow(scrollRef as React.RefObject<HTMLDivElement>, 'left')
          }
          className='absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80'
        >
          <ChevronLeft className='w-5 h-5 text-white' />
        </button>
        <button
          onClick={() =>
            scrollRow(scrollRef as React.RefObject<HTMLDivElement>, 'right')
          }
          className='absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80'
        >
          <ChevronRight className='w-5 h-5 text-white' />
        </button>
        <div
          ref={scrollRef}
          className='flex gap-3 overflow-x-auto scrollbar-hide pb-2'
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
          {items.map((item, idx) => (
            <NetflixScrollCard
              key={`${item.id}-${idx}`}
              item={item}
              onClick={() =>
                router.push(
                  `/play?title=${encodeURIComponent(item.title)}${
                    item.year ? `&year=${item.year}` : ''
                  }&prefer=true`
                )
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function NetflixScrollCard({
  item,
  onClick,
}: {
  item: DoubanItem;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onClick}
      className='group relative flex-shrink-0 w-44 aspect-[2/3] rounded-xl overflow-hidden cursor-pointer bg-zinc-800'
    >
      {!imgError ? (
        <Image
          src={processImageUrl(item.poster) || '/placeholder.jpg'}
          alt={item.title}
          fill
          className='object-cover transition-transform duration-300 group-hover:scale-110'
          onError={() => setImgError(true)}
          unoptimized
          referrerPolicy='no-referrer'
        />
      ) : (
        <div className='absolute inset-0 flex items-center justify-center bg-zinc-800'>
          <span className='text-zinc-500 text-xs text-center px-2'>
            {item.title}
          </span>
        </div>
      )}
      <div className='absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300' />
      <div className='absolute bottom-2 left-2'>
        <span className='px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center gap-1'>
          <Sparkles className='w-3 h-3' /> HD
        </span>
      </div>
      {item.rate && (
        <div className='absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold rounded flex items-center gap-0.5'>
          ★ {item.rate}
        </div>
      )}
      <div className='absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300'>
        <p className='text-white text-sm font-medium line-clamp-2'>
          {item.title}
        </p>
        {item.year && <p className='text-zinc-400 text-xs mt-1'>{item.year}</p>}
      </div>
    </button>
  );
}

function NetflixGridCard({ item }: { item: DoubanItem }) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() =>
        router.push(
          `/play?title=${encodeURIComponent(item.title)}${
            item.year ? `&year=${item.year}` : ''
          }&prefer=true`
        )
      }
      className='group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer bg-zinc-800'
    >
      {!imgError ? (
        <Image
          src={processImageUrl(item.poster) || '/placeholder.jpg'}
          alt={item.title}
          fill
          className='object-cover transition-all duration-300 group-hover:scale-105'
          onError={() => setImgError(true)}
          unoptimized
          referrerPolicy='no-referrer'
        />
      ) : (
        <div className='absolute inset-0 flex items-center justify-center bg-zinc-800'>
          <span className='text-zinc-500 text-xs text-center px-2'>
            {item.title}
          </span>
        </div>
      )}
      <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all' />
      <div className='absolute inset-0 border-2 border-transparent group-hover:border-[#ff3e6c] rounded-xl transition-all' />
      {item.rate && (
        <div className='absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold rounded flex items-center gap-0.5'>
          ★ {item.rate}
        </div>
      )}
      <div className='absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent'>
        <p className='text-white text-sm font-medium line-clamp-2 group-hover:text-[#ff3e6c] transition-colors'>
          {item.title}
        </p>
        {item.year && <p className='text-zinc-400 text-xs mt-1'>{item.year}</p>}
      </div>
    </button>
  );
}

function NetflixBangumiRow({
  bangumiData,
  scrollRow,
}: {
  bangumiData: BangumiCalendarData[];
  scrollRow: (
    ref: React.RefObject<HTMLDivElement>,
    dir: 'left' | 'right'
  ) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const today = new Date();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayKey = weekdays[today.getDay()];
  const todayAnimes =
    bangumiData.find((d) => d.weekday.en === todayKey)?.items || [];

  if (todayAnimes.length === 0) return null;

  return (
    <section className='mb-10'>
      <SectionTitle
        title='今日新番'
        icon={<Clapperboard className='w-5 h-5 text-[#ff3e6c]' />}
        viewAllHref='/douban?type=anime'
      />
      <div className='relative group'>
        <button
          onClick={() =>
            scrollRow(scrollRef as React.RefObject<HTMLDivElement>, 'left')
          }
          className='absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80'
        >
          <ChevronLeft className='w-5 h-5 text-white' />
        </button>
        <button
          onClick={() =>
            scrollRow(scrollRef as React.RefObject<HTMLDivElement>, 'right')
          }
          className='absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80'
        >
          <ChevronRight className='w-5 h-5 text-white' />
        </button>
        <div
          ref={scrollRef}
          className='flex gap-3 overflow-x-auto scrollbar-hide pb-2'
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
          {todayAnimes.map((anime, idx) => (
            <button
              key={`${anime.id}-${idx}`}
              onClick={() => {
                const animeTitle = anime.name_cn || anime.name;
                const animeYear = anime.air_date
                  ? anime.air_date.split('-')[0]
                  : '';
                router.push(
                  `/play?title=${encodeURIComponent(animeTitle)}${
                    animeYear ? `&year=${animeYear}` : ''
                  }&stype=tv&prefer=true`
                );
              }}
              className='group relative flex-shrink-0 w-44 aspect-[2/3] rounded-xl overflow-hidden cursor-pointer'
            >
              <Image
                src={
                  processImageUrl(
                    anime.images.large ||
                      anime.images.common ||
                      anime.images.medium ||
                      anime.images.small ||
                      anime.images.grid
                  ) || '/placeholder.jpg'
                }
                alt={anime.name_cn || anime.name}
                fill
                className='object-cover transition-transform duration-300 group-hover:scale-110'
                unoptimized
                referrerPolicy='no-referrer'
              />
              <div className='absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all' />
              {anime.rating?.score && (
                <div className='absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold rounded flex items-center gap-0.5'>
                  ★ {anime.rating.score.toFixed(1)}
                </div>
              )}
              <div className='absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform'>
                <p className='text-white text-sm font-medium line-clamp-2'>
                  {anime.name_cn || anime.name}
                </p>
                {anime.air_date && (
                  <p className='text-zinc-400 text-xs mt-1'>
                    {anime.air_date.split('-')[0]}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const TAG_COLORS: Record<string, string> = {
  red: '#ff3e6c',
  accent: '#ff3e6c',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

function TagManagerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tags, setTags] = useState<FavoriteTag[]>([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('red');
  useEffect(() => {
    if (open) setTags(getFavoriteTags());
  }, [open]);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name || tags.some((t) => t.name === name)) return;
    const updated = [...tags, { name, color: TAG_COLORS[newColor] }];
    saveFavoriteTags(updated);
    setTags(updated);
    setNewName('');
  };

  const handleDelete = (index: number) => {
    const deleted = tags[index];
    const updated = tags.filter((_, i) => i !== index);
    saveFavoriteTags(updated);
    setTags(updated);
    const allItems = getAllItemTags();
    for (const key of Object.keys(allItems)) {
      allItems[key] = allItems[key].filter((t) => t !== deleted.name);
    }
    localStorage.setItem('moontv_favorite_tags_items', JSON.stringify(allItems));
  };

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm' onClick={onClose}>
      <div className='bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6' onClick={(e) => e.stopPropagation()}>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-lg font-bold text-zinc-900 dark:text-white'>管理標籤</h3>
          <button onClick={onClose} className='text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'>
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='space-y-3'>
          {tags.map((tag, i) => (
            <div key={tag.name} className='flex items-center gap-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl'>
              <span className='w-3 h-3 rounded-full flex-shrink-0' style={{ backgroundColor: tag.color }} />
              <span className='flex-1 text-sm font-medium text-zinc-900 dark:text-white'>{tag.name}</span>
              <button onClick={() => handleDelete(i)} className='text-zinc-400 hover:text-red-500 transition-colors'>
                <Trash2 className='w-4 h-4' />
              </button>
            </div>
          ))}
        </div>

        <div className='flex items-center gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800'>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder='新增標籤名稱...'
            className='flex-1 px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-[#ff3e6c]/50 text-zinc-900 dark:text-white placeholder-zinc-400'
          />
          <select
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className='px-2 py-2 text-xs bg-zinc-100 dark:bg-zinc-800 rounded-xl outline-none text-zinc-900 dark:text-white'
          >
            {Object.entries(TAG_COLORS).map(([name, color]) => (
              <option key={name} value={name} style={{ backgroundColor: color }}>
                {name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className='px-3 py-2 bg-[#ff3e6c] text-white text-sm font-medium rounded-xl hover:bg-[#ff557e] transition-colors'
          >
            <Plus className='w-4 h-4' />
          </button>
        </div>
      </div>
    </div>
  );
}

function FavoritesView() {
  const [favoriteItems, setFavoriteItems] = useState<
    {
      id: string;
      source: string;
      title: string;
      poster: string;
      episodes: number;
      source_name: string;
      currentEpisode?: number;
      search_title?: string;
      year?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [itemTags, setItemTagsState] = useState<Record<string, string[]>>({});
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [definedTags, setDefinedTags] = useState<FavoriteTag[]>([]);

  const updateFavoriteItems = useCallback(
    async (allFavorites: Record<string, unknown>) => {
      const allPlayRecords = await getAllPlayRecords();
      const sorted = Object.entries(allFavorites)
        .sort(
          ([, a], [, b]) =>
            (b as { save_time: number }).save_time -
            (a as { save_time: number }).save_time
        )
        .map(([key, fav]) => {
          const plusIndex = key.indexOf('+');
          const source = key.slice(0, plusIndex);
          const id = key.slice(plusIndex + 1);
          const playRecord = allPlayRecords[key];
          const f = fav as {
            title: string;
            year?: string;
            cover: string;
            total_episodes: number;
            source_name: string;
            search_title?: string;
          };
          return {
            id,
            source,
            title: f.title,
            year: f.year,
            poster: f.cover,
            episodes: f.total_episodes,
            source_name: f.source_name,
            currentEpisode: playRecord?.index,
            search_title: f.search_title,
          };
        });
      setFavoriteItems(sorted);
    },
    []
  );

  useEffect(() => {
    const load = async () => {
      const allFavorites = await getAllFavorites();
      await updateFavoriteItems(allFavorites);
      setItemTagsState(getAllItemTags());
      setDefinedTags(getFavoriteTags());
      setLoading(false);
    };
    load();
    const unsub = subscribeToDataUpdates(
      'favoritesUpdated',
      updateFavoriteItems
    );
    return unsub;
  }, [updateFavoriteItems]);

  const refreshTags = () => {
    setItemTagsState(getAllItemTags());
    setDefinedTags(getFavoriteTags());
  };

  const handleClearAll = async () => {
    await clearAllFavorites();
    setFavoriteItems([]);
    localStorage.removeItem('moontv_favorite_tags_items');
    setItemTagsState({});
  };

  const filteredItems = activeTag
    ? favoriteItems.filter((item) => {
        const key = `${item.source}+${item.id}`;
        return (itemTags[key] || []).includes(activeTag);
      })
    : favoriteItems;

  const getItemTagNames = (key: string) => itemTags[key] || [];

  const toggleItemTag = (key: string, tagName: string) => {
    const current = getItemTagNames(key);
    const updated = current.includes(tagName)
      ? current.filter((t) => t !== tagName)
      : [...current, tagName];
    setItemTags(key, updated);
    setItemTagsState((prev) => ({ ...prev, [key]: updated }));
  };

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <BookMarked className='w-6 h-6 text-[#ff3e6c]' />
          <h2 className='text-2xl font-bold text-zinc-900 dark:text-white'>
            我的收藏
          </h2>
        </div>
        <div className='flex items-center gap-2'>
          {definedTags.length > 0 && (
            <button
              onClick={() => setTagManagerOpen(true)}
              className='text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1'
            >
              <Tag className='w-4 h-4' />
              <span className='hidden sm:inline'>管理標籤</span>
            </button>
          )}
          {favoriteItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className='text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors'
            >
              清空全部
            </button>
          )}
        </div>
      </div>

      {definedTags.length > 0 && (
        <div className='flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1'>
          <button
            onClick={() => setActiveTag(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTag === null
                ? 'bg-[#ff3e6c] text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            全部 ({favoriteItems.length})
          </button>
          {definedTags.map((tag) => {
            const count = favoriteItems.filter((item) => {
              const key = `${item.source}+${item.id}`;
              return (itemTags[key] || []).includes(tag.name);
            }).length;
            return (
              <button
                key={tag.name}
                onClick={() => setActiveTag(tag.name)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTag === tag.name
                    ? 'text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
                style={activeTag === tag.name ? { backgroundColor: tag.color } : undefined}
              >
                <span className='w-2 h-2 rounded-full' style={{ backgroundColor: tag.color }} />
                {tag.name} ({count})
              </button>
            );
          })}
          <button
            onClick={() => setTagManagerOpen(true)}
            className='flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1'
          >
            <Settings2 className='w-3 h-3' />
          </button>
        </div>
      )}

      {loading ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4'>
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className='aspect-[2/3] rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse'
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-24 text-zinc-500'>
          <BookMarked className='w-16 h-16 mb-4 opacity-30' />
          <p className='text-lg'>
            {activeTag ? '此標籤尚無內容' : '尚無收藏內容'}
          </p>
          <p className='text-sm mt-1'>
            {activeTag ? '試試其他標籤' : '快去探索心儀的影視作品吧！'}
          </p>
        </div>
      ) : definedTags.length === 0 ? (
        <div>
          <button
            onClick={() => setTagManagerOpen(true)}
            className='mb-6 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-2'
          >
            <Plus className='w-4 h-4' /> 建立分類標籤
          </button>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4'>
            {favoriteItems.map((item) => (
              <div key={`${item.source}-${item.id}`} className='w-full'>
                <VideoCard
                  query={item.search_title}
                  {...item}
                  from='favorite'
                  type={item.episodes > 1 ? 'tv' : ''}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4'>
          {filteredItems.map((item) => {
            const key = `${item.source}+${item.id}`;
            const itemTagNames = getItemTagNames(key);
            const isEditing = editingItemKey === key;
            return (
              <div
                key={key}
                className='w-full relative group'
                onMouseEnter={() => setEditingItemKey(key)}
                onMouseLeave={() => setEditingItemKey(null)}
              >
                <VideoCard
                  query={item.search_title}
                  {...item}
                  from='favorite'
                  type={item.episodes > 1 ? 'tv' : ''}
                />
                {(isEditing || editingItemKey === null) && definedTags.length > 0 && (
                  <div className={`absolute top-2 left-2 right-2 flex flex-wrap gap-1 ${isEditing ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    {definedTags.map((tag) => {
                      const active = itemTagNames.includes(tag.name);
                      return (
                        <button
                          key={tag.name}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleItemTag(key, tag.name);
                          }}
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium transition-all ${
                            active
                              ? 'text-white shadow-sm'
                              : 'bg-black/50 text-white/70 hover:bg-black/70'
                          }`}
                          style={active ? { backgroundColor: tag.color } : undefined}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TagManagerModal
        open={tagManagerOpen}
        onClose={() => {
          setTagManagerOpen(false);
          refreshTags();
        }}
      />
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

/* ========== 頁面包裝元件（資料載入）========== */
export function NetflixHomePage() {
  const [hotMovies, setHotMovies] = useState<DoubanItem[]>([]);
  const [hotTvShows, setHotTvShows] = useState<DoubanItem[]>([]);
  const [hotVarietyShows, setHotVarietyShows] = useState<DoubanItem[]>([]);
  const [bangumiData, setBangumiData] = useState<BangumiCalendarData[]>([]);
  const [playRecords, setPlayRecords] = useState<
    (PlayRecord & { key: string })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesData, tvShowsData, varietyData, bangumi, records] =
          await Promise.all([
            getDoubanCategories({
              kind: 'movie',
              category: '热门',
              type: '全部',
            }).catch(() => {
              return { code: 500, message: 'error', list: [] };
            }),
            getDoubanCategories({
              kind: 'tv',
              category: 'tv',
              type: 'tv',
            }).catch(() => {
              return { code: 500, message: 'error', list: [] };
            }),
            getDoubanCategories({
              kind: 'tv',
              category: 'show',
              type: 'show',
            }).catch(() => {
              return { code: 500, message: 'error', list: [] };
            }),
            GetBangumiCalendarData().catch(() => {
              return [];
            }),
            getAllPlayRecords().catch(() => {
              return {};
            }),
          ]);
        if (moviesData.code === 200) setHotMovies(moviesData.list);
        if (tvShowsData.code === 200) setHotTvShows(tvShowsData.list);
        if (varietyData.code === 200) setHotVarietyShows(varietyData.list);
        setBangumiData(bangumi);

        // 處理播放記錄：按 save_time 降序
        const recordsArray = Object.entries(records)
          .map(([key, record]) => ({ ...record, key }))
          .sort((a, b) => b.save_time - a.save_time);
        setPlayRecords(recordsArray);
      } catch {
        // keep empty on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-50 dark:bg-[#040404] flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-[#ff3e6c] border-t-transparent rounded-full animate-spin' />
          <p className='text-zinc-500 dark:text-zinc-400'>載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <NetflixHome
      hotMovies={hotMovies}
      hotTvShows={hotTvShows}
      hotVarietyShows={hotVarietyShows}
      bangumiData={bangumiData}
      playRecords={playRecords}
    />
  );
}
