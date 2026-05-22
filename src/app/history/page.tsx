/* eslint-disable @typescript-eslint/no-explicit-any, no-console, @next/next/no-img-element */

'use client';

import { Clock, Search, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { PlayRecord } from '@/lib/db.client';
import {
  clearAllPlayRecords,
  deletePlayRecord,
  getAllPlayRecords,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { processImageUrl } from '@/lib/utils';

import PageLayout from '@/components/PageLayout';

type RecordEntry = PlayRecord & { key: string; source: string; id: string };

export default function HistoryPage() {
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const loadRecords = useCallback(async () => {
    try {
      const all = await getAllPlayRecords();
      const arr = Object.entries(all)
        .map(([key, record]) => {
          const plusIdx = key.indexOf('+');
          const source =
            plusIdx > -1 ? key.slice(0, plusIdx) : (record as any).source || '';
          const id =
            plusIdx > -1
              ? key.slice(plusIdx + 1)
              : (record as any).vod_id || (record as any).id || '';
          return { ...record, key, source, id } as RecordEntry;
        })
        .filter((r) => r.title && r.key)
        .sort((a, b) => b.save_time - a.save_time);
      setRecords(arr);
    } catch (e) {
      console.error('載入觀看記錄失敗:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
    const unsub = subscribeToDataUpdates<Record<string, PlayRecord>>(
      'playRecordsUpdated',
      (all) => {
        const arr = Object.entries(all || {})
          .map(([key, record]) => {
            const plusIdx = key.indexOf('+');
            const source =
              plusIdx > -1
                ? key.slice(0, plusIdx)
                : (record as any).source || '';
            const id =
              plusIdx > -1
                ? key.slice(plusIdx + 1)
                : (record as any).vod_id || (record as any).id || '';
            return { ...record, key, source, id } as RecordEntry;
          })
          .filter((r) => r.title && r.key)
          .sort((a, b) => b.save_time - a.save_time);
        setRecords(arr);
      }
    );
    return () => unsub?.();
  }, [loadRecords]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.trim().toLowerCase();
    return records.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.source_name || '').toLowerCase().includes(q) ||
        (r.search_title || '').toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  const handleDelete = async (record: RecordEntry) => {
    try {
      const src =
        record.source ||
        (record.key.includes('+') ? record.key.split('+')[0] : '');
      const rid =
        record.id || (record.key.includes('+') ? record.key.split('+')[1] : '');
      if (src && rid) {
        await deletePlayRecord(src, rid);
      }
      setRecords((prev) => prev.filter((r) => r.key !== record.key));
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        next.delete(record.key);
        return next;
      });
    } catch (e) {
      console.error('刪除記錄失敗:', e);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedKeys.size === 0) return;
    const targets = records.filter((r) => selectedKeys.has(r.key));
    try {
      await Promise.all(
        targets.map((r) => {
          const src =
            r.source || (r.key.includes('+') ? r.key.split('+')[0] : '');
          const rid = r.id || (r.key.includes('+') ? r.key.split('+')[1] : '');
          if (src && rid) return deletePlayRecord(src, rid);
          return Promise.resolve();
        })
      );
      setRecords((prev) => prev.filter((r) => !selectedKeys.has(r.key)));
      setSelectedKeys(new Set());
    } catch (e) {
      console.error('批量刪除失敗:', e);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('確定要清除所有觀看記錄嗎？此動作無法復原。')) return;
    try {
      await clearAllPlayRecords();
      setRecords([]);
      setSelectedKeys(new Set());
    } catch (e) {
      console.error('清除所有記錄失敗:', e);
    }
  };

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedKeys.size === filteredRecords.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(filteredRecords.map((r) => r.key)));
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60 * 1000) return '剛剛';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分鐘前`;
    if (diff < 24 * 60 * 60 * 1000)
      return `${Math.floor(diff / 3600000)} 小時前`;
    if (diff < 7 * 24 * 60 * 60 * 1000)
      return `${Math.floor(diff / 86400000)} 天前`;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <PageLayout activePath='/history'>
      <div className='px-4 md:px-8 py-6 max-w-6xl mx-auto'>
        {/* 頁面標題 */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
          <div className='flex items-center gap-3'>
            <Clock className='w-7 h-7 text-[#ff3e6c]' />
            <h1 className='text-2xl font-bold text-zinc-900 dark:text-white'>
              觀看記錄
            </h1>
            <span className='text-sm text-zinc-500 dark:text-zinc-400'>
              ({records.length})
            </span>
          </div>

          <div className='flex items-center gap-2'>
            {records.length > 0 && (
              <>
                <button
                  onClick={() => {
                    setSelectMode(!selectMode);
                    if (selectMode) setSelectedKeys(new Set());
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectMode
                      ? 'bg-[#ff3e6c]/10 text-[#ff3e6c] border border-[#ff3e6c]/30'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  {selectMode ? '取消選擇' : '批量選擇'}
                </button>

                {selectMode && selectedKeys.size > 0 && (
                  <button
                    onClick={handleBatchDelete}
                    className='px-3 py-1.5 text-sm bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-1'
                  >
                    <Trash2 className='w-3.5 h-3.5' />
                    刪除所選 ({selectedKeys.size})
                  </button>
                )}

                <button
                  onClick={handleClearAll}
                  className='px-3 py-1.5 text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 border border-transparent hover:border-red-300 dark:hover:border-red-700 rounded-lg transition-colors flex items-center gap-1'
                >
                  <Trash2 className='w-3.5 h-3.5' />
                  清空全部
                </button>
              </>
            )}
          </div>
        </div>

        {/* 搜尋欄 */}
        {records.length > 0 && (
          <div className='relative mb-6 max-w-md'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='搜尋觀看記錄...'
              className='w-full h-10 pl-10 pr-8 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff3e6c] focus:outline-none transition-colors'
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
              >
                <X className='w-4 h-4' />
              </button>
            )}
          </div>
        )}

        {/* 全選 */}
        {selectMode && filteredRecords.length > 0 && (
          <div className='mb-3'>
            <label className='flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 cursor-pointer select-none'>
              <input
                type='checkbox'
                checked={
                  selectedKeys.size === filteredRecords.length &&
                  filteredRecords.length > 0
                }
                onChange={toggleSelectAll}
                className='w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-[#ff3e6c] focus:ring-[#ff3e6c]'
              />
              全選 ({filteredRecords.length} 項)
            </label>
          </div>
        )}

        {/* 記錄列表 */}
        {loading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className='h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse'
              />
            ))}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-24 text-zinc-500'>
            <Clock className='w-16 h-16 mb-4 opacity-30' />
            <p className='text-lg'>
              {searchQuery ? '找不到匹配的記錄' : '尚無觀看記錄'}
            </p>
            <p className='text-sm mt-1'>
              {searchQuery
                ? '試試其他關鍵字'
                : '開始觀看影片後，記錄會自動出現在這裡'}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
            {filteredRecords.map((record) => {
              const progress =
                record.total_time > 0
                  ? Math.round((record.play_time / record.total_time) * 100)
                  : 0;
              const isSelected = selectedKeys.has(record.key);

              return (
                <div
                  key={record.key}
                  className={`group relative flex gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? 'border-[#ff3e6c] bg-[#ff3e6c]/5'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm'
                  }`}
                >
                  {/* 選擇模式勾選框 */}
                  {selectMode && (
                    <div className='absolute top-3 left-3 z-10'>
                      <input
                        type='checkbox'
                        checked={isSelected}
                        onChange={() => toggleSelect(record.key)}
                        className='w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-[#ff3e6c] focus:ring-[#ff3e6c]'
                      />
                    </div>
                  )}

                  {/* 封面 */}
                  <Link
                    href={`/play?source=${encodeURIComponent(
                      record.source
                    )}&id=${encodeURIComponent(
                      record.id
                    )}&title=${encodeURIComponent(record.title)}${
                      record.search_title
                        ? `&stitle=${encodeURIComponent(record.search_title)}`
                        : ''
                    }`}
                    className={`flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 ${
                      selectMode ? 'pointer-events-none' : ''
                    }`}
                  >
                    {record.cover ? (
                      <img
                        src={
                          processImageUrl(record.cover) || '/placeholder.jpg'
                        }
                        alt={record.title}
                        className='w-full h-full object-cover'
                        referrerPolicy='no-referrer'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-zinc-400'>
                        <Clock className='w-5 h-5' />
                      </div>
                    )}
                  </Link>

                  {/* 資訊 */}
                  <div className='flex-1 min-w-0'>
                    <Link
                      href={`/play?source=${encodeURIComponent(
                        record.source
                      )}&id=${encodeURIComponent(
                        record.id
                      )}&title=${encodeURIComponent(record.title)}${
                        record.search_title
                          ? `&stitle=${encodeURIComponent(record.search_title)}`
                          : ''
                      }`}
                      className={`font-medium text-sm text-zinc-900 dark:text-white truncate block hover:text-[#ff3e6c] transition-colors ${
                        selectMode ? 'pointer-events-none' : ''
                      }`}
                    >
                      {record.title}
                    </Link>

                    <div className='flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
                      {record.source_name && (
                        <span className='px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px]'>
                          {(record.source_name || '')
                            .replace(/資源$/, '')
                            .replace(/片源$/, '')}
                        </span>
                      )}
                      {record.year && <span>{record.year}</span>}
                    </div>

                    {/* 進度 */}
                    <div className='mt-1.5'>
                      <div className='flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-0.5'>
                        <span>
                          {record.index > 0 && record.total_episodes > 0
                            ? `第 ${record.index} / ${record.total_episodes} 集`
                            : record.total_episodes > 1
                            ? `${record.total_episodes} 集`
                            : ''}
                        </span>
                        <span>{progress}%</span>
                      </div>
                      <div className='w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-[#ff3e6c] rounded-full transition-all'
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {record.play_time > 0 && (
                        <div className='text-[10px] text-zinc-400 mt-0.5 text-right'>
                          看到 {formatDuration(record.play_time)}
                        </div>
                      )}
                    </div>

                    {/* 時間 */}
                    <div className='text-[10px] text-zinc-400 mt-1'>
                      {formatDate(record.save_time)}
                    </div>
                  </div>

                  {/* 刪除按鈕 */}
                  {!selectMode && (
                    <button
                      onClick={() => handleDelete(record)}
                      className='absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-zinc-300 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all duration-200'
                    >
                      <X className='w-3 h-3' />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 底部留白 */}
        <div className='h-20' />
      </div>
    </PageLayout>
  );
}
