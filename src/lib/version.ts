export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

export const CHANGELOGS: ChangelogItem[] = [
  {
    version: 'v1.1.0',
    date: '2026-05-21',
    content:
      '番劇日曆整合至動漫頻道、我的片單分類標籤系統、播放器子母畫面按鈕。',
  },
  {
    version: 'v1.0.9',
    date: '2026-05-21',
    content:
      '播放器增強：自動連播開關（可記憶）、快捷鍵幫助面板（?/H 鍵顯示）、繼續觀看卡牌文字縮小。',
  },
  {
    version: 'v1.0.8',
    date: '2026-05-21',
    content:
      '全面 UI/UX 優化：主題一致性修復、手機篩選折疊、側欄折疊 tooltip、底部導航加入搜尋、橫向捲動手機提示。',
  },
  {
    version: 'v1.0.7',
    date: '2026-05-20',
    content:
      '修復 Docker 建置失敗：deps 階段跳過 husky install（無 .git）、拆分建置步驟以利除錯。',
  },
  {
    version: 'v1.0.6',
    date: '2026-05-20',
    content:
      '統一 Netflix 紅色主題：修正搜索頁、播放器、直播頁、設定頁、卡片等處綠色/藍色不一致；修正愛心圖示顏色；簡體中文轉繁體。',
  },
  {
    version: 'v1.0.5',
    date: '2026-05-20',
    content:
      '建立 /settings 本地設置頁面（豆瓣數據代理、圖片代理、搜索與播放開關）、修正設定按鈕路由。',
  },
  {
    version: 'v1.0.4',
    date: '2026-05-20',
    content:
      '重新設計登入頁面 - 電影級動態背景、發光按鈕、掃描線效果、全新視覺層級。',
  },
  {
    version: 'v1.0.3',
    date: '2026-05-20',
    content:
      '重新設計選集/換源 UI - Netflix 風格標籤、圓角按鈕、發光當前標記、更好的響應式佈局。',
  },
  {
    version: 'v1.0.2',
    date: '2026-05-20',
    content: '移除生產環境 console.log 除錯代碼。',
  },
  {
    version: 'v1.0.1',
    date: '2026-05-20',
    content: '修正設定按鈕 404 錯誤 - 路由從 /profile 改為 /admin。',
  },
];

export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v1.0.4';
