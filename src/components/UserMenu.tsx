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
    /* 終極防護：z-[99999] 絕對凌駕於所有影片海報之上，確保點擊事件 100% 觸發 */
    <div className="relative z-[99999] pointer-events-auto block">
      
      {/* 頂部頭像按鈕 ── 完美原版高質感電影漸層頭像 */}
      <div 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation(); // 徹底阻斷背景海報 Slider 的訊號攔截
          setIsOpen(!isOpen);
        }} 
        className="flex items-center space-x-3 cursor-pointer group select-none relative z-[99999]"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#e50914] to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
          站
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition">站長</p>
          <p className="text-[10px] text-zinc-500">asd0983283925</p>
        </div>
      </div>

      {/* 下拉選單 ── 採用超高相容性純色深背景，100% 通電 */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#121214] border border-zinc-800 p-2 shadow-2xl z-[99999]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2.5 border-b border-zinc-900 select-none">
            <p className="text-xs text-zinc-500">當前用戶</p>
            <p className="text-sm font-bold text-white truncate mt-0.5">asd09832839...</p>
          </div>
          
          {/* 使用超高容錯的 a 標籤，徹底消除所有點擊死角 */}
          <div className="p-1 space-y-0.5 relative z-[99999]">
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-xl text-sm transition text-left cursor-pointer block relative z-[99999]"
            >
              <span>⚙️</span> <span>設置</span>
            </a>
            
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-xl text-sm transition text-left cursor-pointer block relative z-[99999]"
            >
              <span>🛡️</span> <span>管理面板</span>
            </a>
            
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-red-400 hover:bg-red-950/20 rounded-xl text-sm transition font-medium border-t border-zinc-900/50 mt-1 text-left cursor-pointer block relative z-[99999]"
            >
              <span>🚪</span> <span>登出</span>
            </a>
          </div>

          {/* 底部純淨版號 ── 100% 乾淨、無任何黃點、點擊直接喚醒彈窗 */}
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowVersion(true); // 喚醒彈窗
              setIsOpen(false);     // 關閉下拉
            }}
            className="mt-1 border-t border-zinc-900/80 pt-2 pb-1 text-center cursor-pointer group flex items-center justify-center select-none relative z-[99999] w-full"
          >
            <span className="text-[11px] font-medium text-zinc-500 group-hover:text-[#e50914] transition tracking-wider block w-full py-1">
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