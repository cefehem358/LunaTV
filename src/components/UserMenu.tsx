'use client';

import React, { useState, useEffect } from 'react';
import { CURRENT_VERSION, CHANGELOGS } from '@/lib/version';
import { VersionPanel } from './VersionPanel';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showVersion, setShowVersion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasNewVersion, setHasNewVersion] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 智慧動態檢查邏輯：
    // 假設模擬從伺服器 API 獲取最新版本（這裡與我們定義的日誌最新一筆比對）
    // 未來如果你發布了新版本（例如雲端配置改成了 v2.0.4，而使用者本地還是 v2.0.3），黃點才會亮！
    const LATEST_SERVER_VERSION = CHANGELOGS[0]?.version || 'v2.0.3';
    
    if (CURRENT_VERSION !== LATEST_SERVER_VERSION) {
      setHasNewVersion(true); // 本地不等於最新版，亮起黃點
    } else {
      setHasNewVersion(false); // 已經是最新版，自動隱藏黃點！
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative z-50">
      {/* 頂部頭像點擊按鈕 */}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center space-x-3 cursor-pointer group select-none"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#e50914] to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-md relative">
          站
          {/* 如果有新版本更新，頭像右上角也會貼心閃爍小黃點 */}
          {hasNewVersion && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-yellow-500 rounded-full border border-[#0c0c0e] animate-pulse"></span>
          )}
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition">站長</p>
          <p className="text-[10px] text-zinc-500">asd0983283925</p>
        </div>
      </div>

      {/* 下拉選單選項 */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#0c0c0e]/95 backdrop-blur-xl border border-zinc-800 p-2 shadow-2xl animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div className="px-4 py-2.5 border-b border-zinc-900">
            <p className="text-xs text-zinc-500">當前用戶</p>
            <p className="text-sm font-bold text-white truncate mt-0.5">asd09832839...</p>
          </div>
          
          <div className="p-1 space-y-0.5">
            <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-xl text-sm transition">
              <span>⚙️</span> <span>設置</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-xl text-sm transition">
              <span>🛡️</span> <span>管理面板</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-red-400 hover:bg-red-950/20 rounded-xl text-sm transition font-medium border-t border-zinc-900/50 mt-1">
              <span>🚪</span> <span>登出</span>
            </button>
          </div>

          {/* 版本號欄位：只有在 hasNewVersion 為 true 時才在旁邊顯示動態提示黃點 */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setShowVersion(true);
              setIsOpen(false);
            }}
            className="mt-1 border-t border-zinc-900/80 pt-2 pb-1 text-center cursor-pointer group flex items-center justify-center space-x-1.5"
          >
            <span className="text-[11px] font-medium text-zinc-600 group-hover:text-[#e50914] transition tracking-wider">
              {CURRENT_VERSION}
            </span>
            {hasNewVersion && (
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
            )}
          </div>
        </div>
      )}

      {/* 版本信息對話框連動掛載 */}
      {showVersion && <VersionPanel onClose={() => setShowVersion(false)} />}
    </div>
  );
}

export default UserMenu;