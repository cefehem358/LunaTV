export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

export const CHANGELOGS: ChangelogItem[] = [
  { 
    version: 'v1.0.5', 
    date: '2026-05-20', 
    content: '建立 /settings 本地設置頁面（豆瓣數據代理、圖片代理、搜索與播放開關）、修正設定按鈕路由。' 
  },
  { 
    version: 'v1.0.4', 
    date: '2026-05-20', 
    content: '重新設計登入頁面 - 電影級動態背景、發光按鈕、掃描線效果、全新視覺層級。' 
  },
  { 
    version: 'v1.0.3', 
    date: '2026-05-20', 
    content: '重新設計選集/換源 UI - Netflix 風格標籤、圓角按鈕、發光當前標記、更好的響應式佈局。' 
  },
  { 
    version: 'v1.0.2', 
    date: '2026-05-20', 
    content: '移除生產環境 console.log 除錯代碼。' 
  },
  { 
    version: 'v1.0.1', 
    date: '2026-05-20', 
    content: '修正設定按鈕 404 錯誤 - 路由從 /profile 改為 /admin。' 
  }
];

export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v1.0.4';
