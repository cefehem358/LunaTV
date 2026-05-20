export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

export const CHANGELOGS: ChangelogItem[] = [
  { 
    version: 'v2.0.3', 
    date: '2026-05-20', 
    content: '🚀 釋出 v2.0.3 智慧偵測版！實作動態版本比對機制。只有當本地版本落後於雲端最新版時才會亮起黃點提醒，當前版本則保持絕對純淨。' 
  },
  { 
    version: 'v2.0.2', 
    date: '2026-05-20', 
    content: '重構 UserMenu 核心結構，徹底清除靜態黃點與文字疊加錯誤，達成前台視覺零瑕疵境界。' 
  },
  { 
    version: 'v2.0.1', 
    date: '2026-05-20', 
    content: '修正版本對話框（VersionPanel）的手動關閉 onClose 回呼函數，阻斷首頁反覆彈出之無窮迴圈 Bug。' 
  },
  { 
    version: 'v2.0.0', 
    date: '2026-05-20', 
    content: '大版本里程碑！整合原生高效繁簡字典映射，全站完美繁體化，迎來黃金穩定完全體。' 
  }
];

export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v2.0.3';