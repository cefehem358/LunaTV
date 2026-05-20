/* eslint-disable no-console,react-hooks/exhaustive-deps */

'use client';

import {
  CheckCircle,
  Download,
  ExternalLink,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { changelog, ChangelogEntry } from '@/lib/changelog';
import { CURRENT_VERSION } from '@/lib/version';
import { compareVersions, UpdateStatus } from '@/lib/version_check';

interface VersionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RemoteChangelogEntry {
  version: string;
  date: string;
  added: string[];
  changed: string[];
  fixed: string[];
}

export const VersionPanel: React.FC<VersionPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);
  const [remoteChangelog, setRemoteChangelog] = useState<ChangelogEntry[]>([]);
  const [hasUpdate, setIsHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [showRemoteContent, setShowRemoteContent] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const body = document.body;
      const html = document.documentElement;
      const originalBodyOverflow = body.style.overflow;
      const originalHtmlOverflow = html.style.overflow;
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
      return () => {
        body.style.overflow = originalBodyOverflow;
        html.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchRemoteChangelog();
    }
  }, [isOpen]);

  const fetchRemoteChangelog = async () => {
    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/Berserker8888/LunaTV/main/CHANGELOG'
      );
      if (response.ok) {
        const content = await response.text();
        const parsed = parseChangelog(content);
        setRemoteChangelog(parsed);
        if (parsed.length > 0) {
          const latest = parsed[0];
          setLatestVersion(latest.version);
          setIsHasUpdate(
            compareVersions(latest.version) === UpdateStatus.HAS_UPDATE
          );
        }
      }
    } catch (error) {
      console.error('獲取遠程變更日誌失敗:', error);
    }
  };

  const parseChangelog = (content: string): RemoteChangelogEntry[] => {
    const lines = content.split('\n');
    const versions: RemoteChangelogEntry[] = [];
    let currentVersion: RemoteChangelogEntry | null = null;
    let currentSection: string | null = null;
    let inVersionContent = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      const versionMatch = trimmedLine.match(
        /^## \[([\d.]+)\] - (\d{4}-\d{2}-\d{2})$/
      );
      if (versionMatch) {
        if (currentVersion) versions.push(currentVersion);
        currentVersion = {
          version: versionMatch[1],
          date: versionMatch[2],
          added: [],
          changed: [],
          fixed: [],
        };
        currentSection = null;
        inVersionContent = true;
        continue;
      }

      if (inVersionContent && currentVersion) {
        if (trimmedLine === '### Added') {
          currentSection = 'added';
          continue;
        } else if (trimmedLine === '### Changed') {
          currentSection = 'changed';
          continue;
        } else if (trimmedLine === '### Fixed') {
          currentSection = 'fixed';
          continue;
        }
        if (trimmedLine.startsWith('- ') && currentSection) {
          const entry = trimmedLine.substring(2);
          if (currentSection === 'added') currentVersion.added.push(entry);
          else if (currentSection === 'changed')
            currentVersion.changed.push(entry);
          else if (currentSection === 'fixed') currentVersion.fixed.push(entry);
        }
      }
    }
    if (currentVersion) versions.push(currentVersion);
    return versions;
  };

  const renderChangelogItem = (text: string, color: string) => (
    <li className='flex items-start gap-2 text-sm text-zinc-300'>
      <span
        className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${color}`}
      />
      {text}
    </li>
  );

  const versionPanelContent = (
    <>
      <div
        className='fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000]'
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
      />

      <div
        className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-[#141414] rounded-xl shadow-2xl z-[1001] overflow-hidden border border-white/10'
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Netflix Style Header */}
        <div className='flex items-center justify-between p-4 border-b border-white/10 bg-[#1a1a1a]'>
          <div className='flex items-center gap-3'>
            <h3 className='text-lg font-bold text-white'>版本信息</h3>
            <span className='px-3 py-1 text-sm font-bold bg-[#e50914] text-white rounded-md'>
              v{CURRENT_VERSION}
            </span>
            {hasUpdate && (
              <span className='px-3 py-1 text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-md flex items-center gap-1'>
                <Download className='w-3 h-3' />v{latestVersion}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className='w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Content Area */}
        <div className='p-4 overflow-y-auto max-h-[calc(85vh-72px)]'>
          {/* Update Notification */}
          {hasUpdate && (
            <div className='mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl'>
              <div className='flex items-center gap-4 mb-3'>
                <div className='w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center'>
                  <Download className='w-6 h-6 text-yellow-400' />
                </div>
                <div>
                  <h4 className='text-white font-semibold'>發現新版本</h4>
                  <p className='text-zinc-400 text-sm'>
                    v{CURRENT_VERSION} → v{latestVersion}
                  </p>
                </div>
              </div>
              <a
                href='https://github.com/Berserker8888/LunaTV'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center justify-center gap-2 px-4 py-2.5 bg-[#e50914] hover:bg-[#b2070f] text-white text-sm font-bold rounded-lg transition-colors'
              >
                <ExternalLink className='w-4 h-4' />
                前往 GitHub 下載
              </a>
            </div>
          )}

          {/* Current Version Badge */}
          {!hasUpdate && (
            <div className='mb-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center'>
                  <CheckCircle className='w-6 h-6 text-green-400' />
                </div>
                <div>
                  <h4 className='text-white font-semibold'>當前為最新版本</h4>
                  <p className='text-zinc-400 text-sm'>v{CURRENT_VERSION}</p>
                </div>
              </div>
            </div>
          )}

          {/* Remote Update Content */}
          {hasUpdate && (
            <div className='mb-6'>
              <button
                onClick={() => setShowRemoteContent(!showRemoteContent)}
                className='w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors'
              >
                <span className='text-white font-medium flex items-center gap-2'>
                  <Download className='w-4 h-4 text-yellow-400' />
                  遠程更新內容
                </span>
                <span className='text-zinc-400 text-sm'>
                  {showRemoteContent ? '點擊收起' : '點擊查看'}
                </span>
              </button>

              {showRemoteContent && remoteChangelog.length > 0 && (
                <div className='mt-4 space-y-4'>
                  {remoteChangelog
                    .filter(
                      (entry) =>
                        !changelog.some(
                          (local) => local.version === entry.version
                        )
                    )
                    .map((entry) => (
                      <div
                        key={entry.version}
                        className='p-4 bg-white/5 border border-white/10 rounded-xl'
                      >
                        <div className='flex items-center justify-between mb-3'>
                          <div className='flex items-center gap-2'>
                            <span className='text-lg font-bold text-white'>
                              v{entry.version}
                            </span>
                            {entry.version === latestVersion && (
                              <span className='px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded'>
                                最新
                              </span>
                            )}
                          </div>
                          <span className='text-zinc-500 text-sm'>
                            {entry.date}
                          </span>
                        </div>

                        {entry.added.length > 0 && (
                          <div className='mb-3'>
                            <h5 className='text-sm font-medium text-green-400 mb-2 flex items-center gap-1'>
                              <Plus className='w-3 h-3' /> 新增
                            </h5>
                            <ul className='space-y-1'>
                              {entry.added.map((item) =>
                                renderChangelogItem(item, 'bg-green-500')
                              )}
                            </ul>
                          </div>
                        )}
                        {entry.changed.length > 0 && (
                          <div className='mb-3'>
                            <h5 className='text-sm font-medium text-blue-400 mb-2 flex items-center gap-1'>
                              <RefreshCw className='w-3 h-3' /> 改進
                            </h5>
                            <ul className='space-y-1'>
                              {entry.changed.map((item) =>
                                renderChangelogItem(item, 'bg-blue-500')
                              )}
                            </ul>
                          </div>
                        )}
                        {entry.fixed.length > 0 && (
                          <div>
                            <h5 className='text-sm font-medium text-purple-400 mb-2 flex items-center gap-1'>
                              <CheckCircle className='w-3 h-3' /> 修復
                            </h5>
                            <ul className='space-y-1'>
                              {entry.fixed.map((item) =>
                                renderChangelogItem(item, 'bg-purple-500')
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Local Changelog */}
          <div>
            <h4 className='text-white font-semibold mb-4 flex items-center gap-2'>
              <RefreshCw className='w-4 h-4 text-[#e50914]' />
              本地變更日誌
            </h4>
            <div className='space-y-4'>
              {changelog.map((entry) => {
                const isCurrent = entry.version === CURRENT_VERSION;
                return (
                  <div
                    key={entry.version}
                    className={`p-4 rounded-xl border ${
                      isCurrent
                        ? 'bg-[#e50914]/10 border-[#e50914]/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center gap-2'>
                        <span className='text-lg font-bold text-white'>
                          v{entry.version}
                        </span>
                        {isCurrent && (
                          <span className='px-2 py-0.5 text-xs font-medium bg-[#e50914] text-white rounded'>
                            當前
                          </span>
                        )}
                      </div>
                      <span className='text-zinc-500 text-sm'>
                        {entry.date}
                      </span>
                    </div>

                    {entry.added.length > 0 && (
                      <div className='mb-3'>
                        <h5 className='text-sm font-medium text-green-400 mb-2 flex items-center gap-1'>
                          <Plus className='w-3 h-3' /> 新增
                        </h5>
                        <ul className='space-y-1'>
                          {entry.added.map((item) =>
                            renderChangelogItem(item, 'bg-green-500')
                          )}
                        </ul>
                      </div>
                    )}
                    {entry.changed.length > 0 && (
                      <div className='mb-3'>
                        <h5 className='text-sm font-medium text-blue-400 mb-2 flex items-center gap-1'>
                          <RefreshCw className='w-3 h-3' /> 改進
                        </h5>
                        <ul className='space-y-1'>
                          {entry.changed.map((item) =>
                            renderChangelogItem(item, 'bg-blue-500')
                          )}
                        </ul>
                      </div>
                    )}
                    {entry.fixed.length > 0 && (
                      <div>
                        <h5 className='text-sm font-medium text-purple-400 mb-2 flex items-center gap-1'>
                          <CheckCircle className='w-3 h-3' /> 修復
                        </h5>
                        <ul className='space-y-1'>
                          {entry.fixed.map((item) =>
                            renderChangelogItem(item, 'bg-purple-500')
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (!mounted || !isOpen) return null;
  return createPortal(versionPanelContent, document.body);
};
