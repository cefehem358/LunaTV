'use client';

import { ChevronLeft, ChevronRight, Clapperboard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import {
  BangumiCalendarData,
  GetBangumiCalendarData,
} from '@/lib/bangumi.client';
import { processImageUrl } from '@/lib/utils';

import PageLayout from '@/components/PageLayout';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LABELS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

export default function BangumiPage() {
  const [data, setData] = useState<BangumiCalendarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().getDay();
    return WEEKDAYS[today];
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    GetBangumiCalendarData()
      .then(setData)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const currentDayData = data.find((d) => d.weekday.en === activeDay);
  const items = currentDayData?.items || [];

  const scrollRow = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: dir === 'left' ? -400 : 400,
      behavior: 'smooth',
    });
  };

  return (
    <PageLayout activePath='/bangumi'>
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible'>
        <div className='flex items-center gap-3 mb-6'>
          <Clapperboard className='w-6 h-6 text-[#e50914]' />
          <h1 className='text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white'>
            本季番表
          </h1>
        </div>

        <div className='flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2'>
          {WEEKDAYS.map((day, i) => {
            const count = data.find((d) => d.weekday.en === day)?.items.length || 0;
            const isToday = day === WEEKDAYS[new Date().getDay()];
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeDay === day
                    ? 'bg-[#e50914] text-white shadow-lg shadow-[#e50914]/25'
                    : 'bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <span>{WEEKDAY_LABELS[i]}</span>
                {count > 0 && (
                  <span className='ml-1.5 text-xs opacity-70'>({count})</span>
                )}
                {isToday && <span className='ml-1 text-xs'>· 今天</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4'>
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className='aspect-[2/3] bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse' />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className='text-center py-20 text-zinc-500 dark:text-zinc-500'>
            <p className='text-lg mb-2'>當日無更新番劇</p>
            <p className='text-sm text-zinc-400'>試試看其他星期</p>
          </div>
        ) : (
          <div className='relative group'>
            <button
              onClick={() => scrollRow('left')}
              className='absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80'
            >
              <ChevronLeft className='w-5 h-5 text-white' />
            </button>
            <button
              onClick={() => scrollRow('right')}
              className='absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80'
            >
              <ChevronRight className='w-5 h-5 text-white' />
            </button>
            <div
              ref={scrollRef}
              className='flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2'
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {items.map((anime) => (
                <Link
                  key={anime.id}
                  href={`/play?title=${encodeURIComponent(anime.name_cn || anime.name)}${anime.air_date ? `&year=${anime.air_date.split('-')[0]}` : ''}&stype=tv&prefer=true`}
                  className='group relative flex-shrink-0 w-36 sm:w-44 aspect-[2/3] rounded-xl overflow-hidden'
                >
                  <Image
                    src={processImageUrl(anime.images.large || anime.images.common || anime.images.medium) || '/placeholder.jpg'}
                    alt={anime.name_cn || anime.name}
                    fill
                    className='object-cover transition-transform duration-300 group-hover:scale-105'
                    unoptimized
                    referrerPolicy='no-referrer'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent' />
                  {anime.rating?.score && (
                    <div className='absolute top-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold rounded flex items-center gap-0.5'>
                      ★ {anime.rating.score.toFixed(1)}
                    </div>
                  )}
                  <div className='absolute inset-x-0 bottom-0 p-3'>
                    <p className='text-white text-sm font-semibold line-clamp-2 leading-tight'>
                      {anime.name_cn || anime.name}
                    </p>
                    {anime.air_date && (
                      <p className='text-zinc-400 text-xs mt-1'>{anime.air_date}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </PageLayout>
  );
}
