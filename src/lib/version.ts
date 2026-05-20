export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

export const CHANGELOGS: ChangelogItem[] = [
  { 
    version: 'v2.0.5', 
    date: '2026-05-20', 
    content: '🎉 釋出 v2.0.5 終極定版！雙向打通 UserMenu 與 VersionPanel 的 isOpen 屬性連動，徹底粉碎 AI 覆寫死循環與選單點擊不響應問題。' 
  },
  { 
    version: 'v2.0.2', 
    date: '2026-05-20', 
    content: '重構 UserMenu 核心結構，徹底清除靜態黃點與文字疊加錯誤，達成前台視覺零瑕疵。' 
  }
];

export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v2.0.5';