export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

export const CHANGELOGS: ChangelogItem[] = [
  { 
    version: 'v2.0.4', 
    date: '2026-05-20', 
    content: '🎉 釋出 v2.0.4 終極定版！100% 打通選單點擊電路（突破 Z-index 攔截），並完美還原原本大氣的「站長」專屬漸層頭像。' 
  },
  { 
    version: 'v2.0.3', 
    date: '2026-05-20', 
    content: '實作智慧動態版本比對機制，當前最新版時自動隱藏前台黃點提示。' 
  },
  { 
    version: 'v2.0.2', 
    date: '2026-05-20', 
    content: '重構 UserMenu 核心結構，徹底清除靜態黃點與文字疊加錯誤。' 
  }
];

export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v2.0.4';