'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { CHANGELOGS, CURRENT_VERSION } from '@/lib/version';

interface VersionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersionPanel({ isOpen, onClose }: VersionPanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const panel = (
    <div
      className='fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000]'
      onClick={onClose}
    >
      <div
        className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-[#141414] rounded-xl shadow-2xl z-[1001] overflow-hidden border border-white/10'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-white/10 bg-[#1a1a1a]'>
          <div className='flex items-center gap-3'>
            <h3 className='text-lg font-bold text-white'>版本信息</h3>
            <span className='px-3 py-1 text-sm font-bold bg-[#e50914] text-white rounded-md'>
              {CURRENT_VERSION}
            </span>
          </div>
          <button
            onClick={onClose}
            className='w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors'
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className='p-4 overflow-y-auto max-h-[calc(85vh-72px)] space-y-4'>
          <div className='bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4'>
            <p className='text-white font-semibold'>當前為最新版本</p>
            <p className='text-zinc-400 text-sm mt-1'>
              系統核心引擎已同步至 {CURRENT_VERSION}
            </p>
          </div>

          <p className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>
            🔄 本地變更日誌
          </p>

          {(CHANGELOGS || []).map((log, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${
                index === 0
                  ? 'bg-[#e50914]/10 border-[#e50914]/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className='flex items-center justify-between mb-2'>
                <span className='text-lg font-bold text-white'>{log.version}</span>
                <span className='text-zinc-500 text-sm'>{log.date}</span>
              </div>
              <p className='text-zinc-300 text-sm'>{log.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}