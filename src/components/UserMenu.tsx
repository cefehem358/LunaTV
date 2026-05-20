'use client';

import React, { useState, useEffect } from 'react';
import { CURRENT_VERSION } from '@/lib/version';
import { VersionPanel } from './VersionPanel';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showVersion, setShowVersion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    /* 超強防線：z-[99999] 絕對凌駕全站海報、pointer-events-auto 確保事件絕不漏抓 */
    <div className="relative z-[99999] pointer-events-auto">
      
      {/* 頂部頭像按鈕 ── 100% 還原原版高質感電影漸層頭像與白字 */}
      <div 
        onClick={(e) => {
          e.stopPropagation(); // 阻斷 Next.js 路由與背景海報攔截
          setIsOpen(!isOpen);
        }} 
        className="flex items-center space-x-3 cursor-pointer group select-none relative z-[99999]"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#e50914] to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-md transition transform group-hover:scale-105 duration-200">
          站
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition">站長</p>
          <p className="text-[10px] text-zinc-500">asd0983283925</p>
        </div>
      </div>

      {/* 下拉選單 ── 精確通電，無可撼動 */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#0c0c0e]/95 backdrop-blur-xl border border-zinc-800 p-2 shadow-2xl animate-fade-in z-[99999] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2.5 border-b border-zinc-900">
            <p className="text-xs text-zinc-500">當前用戶</p>
            <p className="text-sm font-bold text-white truncate mt-0.5">asd09832839...</p>
          </div>
          
          <div className="p-1 space-y-0.5 relative z-[99999]">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-xl text-sm transition text-left cursor-pointer relative z-[99999]"
            >
              <span>⚙️</span> <span>設置</span>
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-xl text-sm transition text-left cursor-pointer relative z-[99999]"
            >
              <span>🛡️</span> <span>管理面板</span>
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-red-400 hover:bg-red-950/20 rounded-xl text-sm transition font-medium border-t border-zinc-900/50 mt-1 text-left cursor-pointer relative z-[99999]"
            >
              <span>🚪</span> <span>登出</span>
            </button>
          </div>

          {/* 底部純淨版號 ── 絲滑喚醒歷史紀錄 */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setShowVersion(true);
              setIsOpen(false);
            }}
            className="mt-1 border-t border-zinc-900/80 pt-2 pb-1 text-center cursor-pointer group flex items-center justify-center space-x-1.5 select-none relative z-[99999]"
          >
            <span className="text-[11px] font-medium text-zinc-600 group-hover:text-[#e50914] transition tracking-wider block w-full py-1">
              {CURRENT_VERSION}
            </span>
          </div>
        </div>
      )}

      {/* 版本信息對話框連動掛載 */}
      {showVersion && (
        <VersionPanel 
          onClose={() => {
            setShowVersion(false);
          }} 
        />
      )}
    </div>
  );
}

export default UserMenu;