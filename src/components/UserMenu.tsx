'use client';

import { LogOut, Settings, ShieldCheck, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { CURRENT_VERSION } from '@/lib/version';

import { VersionPanel } from './VersionPanel';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showVersion, setShowVersion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Click-outside detection for dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isOpen]);

  if (!mounted) return null;

  const handleAction = (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);

    if (type === 'settings') {
      router.push('/settings');
    } else if (type === 'admin') {
      router.push('/admin');
    } else if (type === 'logout') {
      router.push('/');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  return (
    <div className='relative z-[999999] pointer-events-auto block user-menu-container'>
      {/* 頂部頭像按鈕 */}
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className='flex items-center space-x-3 cursor-pointer group select-none relative z-[999999]'
      >
        <div className='w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff3e6c] via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-red-500/20 transition transform group-hover:scale-110 group-hover:rotate-3 duration-200'>
          <UserRound className='w-5 h-5' />
        </div>
        <div className='hidden md:block'>
          <p className='text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition'>
            站長
          </p>
          <p className='text-[10px] text-zinc-500 dark:text-zinc-500'>asd0983283925</p>
        </div>
      </div>

      {/* 下拉選單 */}
      {isOpen && (
        <div
          className='absolute right-0 mt-3 w-56 rounded-2xl bg-white dark:bg-[#0c0c0e]/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-2 shadow-2xl z-[999999]'
          onClick={(e) => e.stopPropagation()}
        >
          <div className='px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-900 select-none'>
            <p className='text-xs text-zinc-500'>當前用戶</p>
            <p className='text-sm font-bold text-zinc-900 dark:text-white truncate mt-0.5'>
              asd09832839...
            </p>
          </div>

          <div className='p-1 space-y-0.5 relative z-[999999]'>
            {/* 設置按鈕 */}
            <button
              onClick={(e) => handleAction(e, 'settings')}
              className='w-full flex items-center space-x-3 px-3 py-2.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white rounded-xl text-sm transition text-left cursor-pointer relative z-[999999]'
            >
              <Settings className='w-4 h-4 text-zinc-500' />
              <span>設置</span>
            </button>

            {/* 管理面板 */}
            <button
              onClick={(e) => handleAction(e, 'admin')}
              className='w-full flex items-center space-x-3 px-3 py-2.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white rounded-xl text-sm transition text-left cursor-pointer relative z-[999999]'
            >
              <ShieldCheck className='w-4 h-4 text-zinc-500' />
              <span>管理面板</span>
            </button>

            {/* 登出 */}
            <button
              onClick={(e) => handleAction(e, 'logout')}
              className='w-full flex items-center space-x-3 px-3 py-2.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/20 rounded-xl text-sm transition font-medium border-t border-zinc-200 dark:border-zinc-900/50 mt-1 text-left cursor-pointer relative z-[999999]'
            >
              <LogOut className='w-4 h-4 text-red-500' />
              <span>登出</span>
            </button>
          </div>

          {/* 底部版本號 */}
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowVersion(true);
              setIsOpen(false);
            }}
            className='mt-1 border-t border-zinc-200 dark:border-zinc-900/80 pt-2 pb-1 text-center cursor-pointer group flex items-center justify-center select-none relative z-[999999] w-full'
          >
            <span className='text-[11px] font-medium text-zinc-500 group-hover:text-[#ff3e6c] transition tracking-wider block w-full py-1'>
              {CURRENT_VERSION}
            </span>
          </div>
        </div>
      )}

      {/* 版本信息對話框 */}
      {showVersion && (
        <VersionPanel
          isOpen={showVersion}
          onClose={() => setShowVersion(false)}
        />
      )}
    </div>
  );
}

export default UserMenu;
