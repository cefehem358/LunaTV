'use client';

import React, { useState, useEffect } from 'react';
import { CURRENT_VERSION, CHANGELOGS } from '@/lib/version';

// 核心修復 1：使用具名導出，根治 UserMenu.tsx 的 import { VersionPanel } 錯誤
export function VersionPanel() {
  // 核心修復 2：掛載安全鎖，確保組件只在瀏覽器端渲染，根治 Next.js 靜態打包死白 Exception
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in">
        
        {/* 頂部控制列 */}
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold text-white tracking-tight">版本信息</h3>
            <span className="px-2.5 py-0.5 bg-[#e50914] text-xs font-black text-white rounded-full uppercase tracking-wider">
              {CURRENT_VERSION}
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition text-lg px-2">✕</button>
        </div>

        {/* 內容滾動區 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {/* 當前最新狀態提示框 */}
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-4 flex items-start space-x-3">
            <span className="text-emerald-400 text-lg">✅</span>
            <div>
              <p className="text-sm font-bold text-emerald-400">當前為最新版本</p>
              <p className="text-xs text-zinc-500 mt-0.5">系統核心引擎已同步至 {CURRENT_VERSION}</p>
            </div>
          </div>

          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pt-2 flex items-center space-x-2">
            <span>🔄</span> <span>本地變更日誌</span>
          </p>

          {/* 渲染動態日誌清單 */}
          <div className="space-y-3">
            {(CHANGELOGS || []).map((log, index) => (
              <div key={log.version} className={`p-4 border rounded-2xl transition duration-300 ${index === 0 ? 'bg-zinc-900/50 border-[#e50914]/30' : 'bg-zinc-900/10 border-zinc-900'}`}>
                <div class="flex justify-between items-center">
                  <span className={`text-sm font-black ${index === 0 ? 'text-[#e50914]' : 'text-zinc-300'}`}>{log.version}</span>
                  <span className="text-xs text-zinc-600">{log.date}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed pl-2 border-l border-zinc-800">{log.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 核心修復 3：雙重保險，同時保留預設導出，防止其他組件用 default 引入時抓空
export default VersionPanel;