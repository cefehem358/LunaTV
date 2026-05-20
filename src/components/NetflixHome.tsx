'use client';

import {
  BookMarked,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Clapperboard,
  Film,
  Flag,
  Home,
  Info,
  Play,
  Plus,
  Search,
  Sparkles,
  Star,
  Tv,
  Watch,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { DoubanItem } from '@/lib/types';
import { processImageUrl } from '@/lib/utils';

import { useSite } from '@/components/SiteProvider';
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
  const { announcement } = useSite();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState<'home' | 'favorites'>('home');
  const [showAnnouncement, setShowAnnouncement] = useState(false);

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

  const featuredItem = hotMovies[0] || hotTvShows[0];

  return (
    <div className='min-h-screen bg-[#040404] text-white'>
      {/* ========== A. 固定側邊導覽列 ========== */}
      <aside className='fixed top-0 left-0 h-screen w-64 bg-[#08080a] z-50 flex flex-col border-r border-white/5'>
        {/* Logo */}
        <div className='p-6'>
          <h1 className='text-3xl font-black text-[#e50914] font-[Impact] tracking-wider'>
            LunaTV
          </h1>
        </div>

        {/* 主導航 */}
        <nav className='px-3 space-y-1'>
          <p className='px-4 pt-2 pb-1 text-xs font-semibold text-zinc-600 uppercase tracking-wider'>
            導覽
          </p>
          <NavButton
            active={activeNav === 'home'}
            onClick={() => setActiveNav('home')}
            icon={<Home className='w-5 h-5' />}
            label='首頁'
          />
          <NavButton
            active={false}
            onClick={() => router.push('/douban?type=movie')}
            icon={<Film className='w-5 h-5' />}
            label='電影'
          />
          <NavButton
            active={false}
            onClick={() => router.push('/douban?type=tv')}
            icon={<Tv className='w-5 h-5' />}
            label='劇集'
          />
          <NavButton
            active={false}
            onClick={() => router.push('/douban?type=anime')}
            icon={<Clapperboard className='w-5 h-5' />}
            label='動漫'
          />
          <NavButton
            active={false}
            onClick={() => router.push('/douban?type=show')}
            icon={<Star className='w-5 h-5' />}
            label='綜藝'
          />

          <p className='px-4 pt-5 pb-1 text-xs font-semibold text-zinc-600 uppercase tracking-wider'>
            我的
          </p>
          <NavButton
            active={activeNav === 'favorites'}
            onClick={() => setActiveNav('favorites')}
            icon={<BookMarked className='w-5 h-5' />}
            label='收藏夾'
          />
        </nav>
      </aside>

      {/* ========== 主內容區域 ========== */}
      <div className='pl-64'>
        {/* ========== B. 頂部毛玻璃搜尋列 ========== */}
        <header
          className={`sticky top-0 z-40 h-20 flex items-center justify-between px-8 transition-all duration-300 ${
            isScrolled
              ? 'bg-[#040404]/60 backdrop-blur-xl border-b border-white/5'
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
                className='w-96 h-11 pl-12 pr-4 bg-zinc-900/80 rounded-xl text-white placeholder-zinc-500 border border-transparent focus:border-[#e50914] focus:outline-none transition-all duration-200'
              />
            </div>
          </form>
          <div className='flex items-center gap-6'>
            <UserMenu />
          </div>
        </header>

        {/* ========== 主頁內容 ========== */}
        <main className='px-6 pb-12'>
          {activeNav === 'home' ? (
            <>
              {/* 繼續觀看 */}
              {playRecords.length > 0 && (
                <section className='mb-8'>
                  <div className='flex items-center gap-3 mb-4'>
                    <CirclePlay className='w-5 h-5 text-[#e50914]' />
                    <h3 className='text-xl font-bold text-white'>繼續觀看</h3>
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
                            className='group relative flex-shrink-0 w-80 sm:w-96 md:w-[440px] aspect-[16/9] rounded-xl overflow-hidden cursor-pointer'
                          >
                            <Image
                              src={
                                processImageUrl(record.cover) ||
                                '/placeholder.jpg'
                              }
                              alt={record.title}
                              fill
                              className='object-cover transition-transform duration-300 group-hover:scale-105'
                              unoptimized
                              referrerPolicy='no-referrer'
                            />
                            <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent' />
                            {/* 進度條 */}
                            <div className='absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-700'>
                              <div
                                className='h-full bg-[#e50914] transition-all'
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            {/* 集數標籤 */}
                            <div className='absolute top-3 left-3 px-2.5 py-1 bg-black/75 backdrop-blur-sm text-white text-xs sm:text-sm font-medium rounded-lg'>
                              第{record.index}集 / 共{record.total_episodes}集
                            </div>
                            {/* 標題 */}
                            <div className='absolute inset-x-0 bottom-0 p-4'>
                              <p className='text-white text-sm sm:text-base md:text-lg font-bold line-clamp-1 group-hover:text-[#e50914] transition-colors'>
                                {record.title}
                              </p>
                              <p className='text-zinc-400 text-xs sm:text-sm mt-1 flex items-center gap-1.5'>
                                <Watch className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                                {Math.floor(record.play_time / 60)}分鐘
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* Hero Banner */}
              {featuredItem && (
                <section className='relative h-[480px] rounded-3xl overflow-hidden mb-10'>
                  <div className='absolute inset-0'>
                    <Image
                      src={
                        processImageUrl(featuredItem.poster) ||
                        '/placeholder.jpg'
                      }
                      alt={featuredItem.title}
                      fill
                      className='object-cover'
                      priority
                      unoptimized
                      referrerPolicy='no-referrer'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-[#040404] via-transparent to-transparent' />
                    <div className='absolute inset-0 bg-gradient-to-r from-[#040404]/80 via-transparent to-transparent' />
                  </div>
                  <div className='relative h-full flex flex-col justify-end p-10'>
                    <div className='flex items-center gap-3 mb-4'>
                      <span className='px-3 py-1 bg-[#e50914] text-white text-xs font-bold rounded flex items-center gap-1'>
                        <Flag className='w-3 h-3' /> 今日主打首選
                      </span>
                      <span className='px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded flex items-center gap-1'>
                        <Sparkles className='w-3 h-3' /> HD 1080P
                      </span>
                    </div>
                    <h2 className='text-4xl font-black text-white mb-4 tracking-tight leading-tight max-w-2xl'>
                      {featuredItem.title}
                    </h2>
                    <div className='flex items-center gap-4 mb-6'>
                      <span className='text-zinc-300'>{featuredItem.year}</span>
                      {featuredItem.rate && (
                        <span className='text-yellow-400 font-semibold flex items-center gap-1'>
                          ★ {featuredItem.rate}
                        </span>
                      )}
                    </div>
                    <div className='flex gap-4'>
                      <button
                        onClick={() =>
                          router.push(
                            `/play?title=${encodeURIComponent(
                              featuredItem.title
                            )}${
                              featuredItem.year
                                ? `&year=${featuredItem.year}`
                                : ''
                            }&prefer=true`
                          )
                        }
                        className='flex items-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-[#e50914] hover:text-white transition-all duration-200'
                      >
                        <Play className='w-5 h-5 fill-current' />
                        立即播放
                      </button>
                      <button className='flex items-center gap-2 px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/30 transition-all duration-200'>
                        <Plus className='w-5 h-5' />
                        加入片單
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            `/info?id=${featuredItem.id}&source=douban`
                          )
                        }
                        className='flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200'
                      >
                        <Info className='w-5 h-5' />
                        詳細資訊
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* 熱門電影 */}
              <NetflixSectionRow
                title='熱門電影'
                icon={<Film className='w-5 h-5 text-[#e50914]' />}
                items={hotMovies}
                viewAllHref='/douban?type=movie'
                scrollRow={scrollRow}
              />

              {/* 熱門劇集 */}
              <NetflixSectionRow
                title='熱門劇集'
                icon={<Tv className='w-5 h-5 text-[#e50914]' />}
                items={hotTvShows}
                viewAllHref='/douban?type=tv'
                scrollRow={scrollRow}
              />

              {/* 最新上架網格 */}
              <section className='mb-10'>
                <SectionTitle
                  title='最新上架'
                  icon={<Clapperboard className='w-5 h-5 text-[#e50914]' />}
                  viewAllHref='/douban?type=anime'
                />
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4'>
                  {[...hotMovies, ...hotTvShows]
                    .slice(0, 14)
                    .map((item, idx) => (
                      <NetflixGridCard key={`${item.id}-${idx}`} item={item} />
                    ))}
                </div>
              </section>

              {/* 新番放送（今日） */}
              <NetflixBangumiRow
                bangumiData={bangumiData}
                scrollRow={scrollRow}
              />

              {/* 熱門綜藝 */}
              <NetflixSectionRow
                title='熱門綜藝'
                icon={<Star className='w-5 h-5 text-[#e50914]' />}
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
          <div className='w-full max-w-md rounded-2xl bg-[#1a1a1a] border border-white/10 p-8 shadow-2xl'>
            <div className='flex items-start justify-between mb-6'>
              <div>
                <h3 className='text-xl font-bold text-white mb-1'>系統公告</h3>
                <div className='w-8 h-1 bg-[#e50914] rounded-full' />
              </div>
              <button
                onClick={() => handleCloseAnnouncement(announcement)}
                className='p-1 text-zinc-500 hover:text-white transition-colors'
              >
                <X className='w-5 h-5' />
              </button>
            </div>
            <div className='mb-8'>
              <div className='bg-[#141414] rounded-xl p-5 border-l-4 border-[#e50914]'>
                <p className='text-zinc-300 leading-relaxed'>{announcement}</p>
              </div>
            </div>
            <button
              onClick={() => handleCloseAnnouncement(announcement)}
              className='w-full py-3 bg-[#e50914] hover:bg-[#b8070f] text-white font-bold rounded-xl transition-colors'
            >
              確定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== 內部子元件 ========== */

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl mb-0.5 transition-all duration-200 ${
        active
          ? 'bg-zinc-800 text-white'
          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
      }`}
    >
      {icon}
      <span className='font-medium'>{label}</span>
    </button>
  );
}

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
        <h3 className='text-xl font-bold text-white'>{title}</h3>
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className='flex items-center text-sm text-zinc-400 hover:text-white transition-colors gap-1'
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
      <div className='absolute inset-0 border-2 border-transparent group-hover:border-[#e50914] rounded-xl transition-all' />
      {item.rate && (
        <div className='absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold rounded flex items-center gap-0.5'>
          ★ {item.rate}
        </div>
      )}
      <div className='absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent'>
        <p className='text-white text-sm font-medium line-clamp-2 group-hover:text-[#e50914] transition-colors'>
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
        icon={<Clapperboard className='w-5 h-5 text-[#e50914]' />}
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
      setLoading(false);
    };
    load();
    const unsub = subscribeToDataUpdates(
      'favoritesUpdated',
      updateFavoriteItems
    );
    return unsub;
  }, [updateFavoriteItems]);

  const handleClearAll = async () => {
    await clearAllFavorites();
    setFavoriteItems([]);
  };

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <BookMarked className='w-6 h-6 text-[#e50914]' />
          <h2 className='text-2xl font-bold text-white'>我的收藏</h2>
        </div>
        {favoriteItems.length > 0 && (
          <button
            onClick={handleClearAll}
            className='text-sm text-zinc-500 hover:text-white transition-colors'
          >
            清空全部
          </button>
        )}
      </div>

      {loading ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4'>
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className='aspect-[2/3] rounded-xl bg-zinc-800 animate-pulse'
            />
          ))}
        </div>
      ) : favoriteItems.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-24 text-zinc-500'>
          <BookMarked className='w-16 h-16 mb-4 opacity-30' />
          <p className='text-lg'>尚無收藏內容</p>
          <p className='text-sm mt-1'>快去探索心儀的影視作品吧！</p>
        </div>
      ) : (
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
      )}
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
              category: '熱門',
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
      <div className='min-h-screen bg-[#040404] flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin' />
          <p className='text-zinc-400'>載入中...</p>
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
