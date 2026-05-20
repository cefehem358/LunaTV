export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

// 遵循三段式語意進位，完整記錄從 v0.0.1 至今的每一次重要蛻變
export const CHANGELOGS: ChangelogItem[] = [
  { 
    version: 'v2.0.2', 
    date: '2026-05-20', 
    content: '🎉 釋出 v2.0.2 正式版！重構 UserMenu 核心結構，徹底清除靜態黃點與文字疊加錯誤，達成前台視覺零瑕疵境界。' 
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
  },
  { 
    version: 'v1.0.9', 
    date: '2026-05-20', 
    content: '優化「繼續觀看」卡牌面板，於影片名稱下方成功整合高質感「片源資訊標籤」。' 
  },
  { 
    version: 'v1.0.8', 
    date: '2026-05-20', 
    content: '重構動漫專區篩選狀態機，完美修復番劇與劇場版切換時海報卡牌無法顯示之缺陷。' 
  },
  { 
    version: 'v1.0.6', 
    date: '2026-05-20', 
    content: '首頁全新換裝，升級致敬 Netflix 奢華暗黑風格 UI，引進自適應滿版海報網格。' 
  },
  { 
    version: 'v0.1.0', 
    date: '2026-05-19', 
    content: '🚀 核心架構進位！由 v0.0.9 順利遞增，完成後端資料庫整合與使用者選單組件初始化。' 
  },
  { 
    version: 'v0.0.9', 
    date: '2026-05-18', 
    content: '日常修復疊加：完成前端快取機制優化，進入 0.0.x 階段最後一次微調。' 
  },
  { 
    version: 'v0.0.2', 
    date: '2026-05-18', 
    content: '介面微調：微調首頁基礎導覽列樣式與毛玻璃特效。' 
  },
  { 
    version: 'v0.0.1', 
    date: '2026-05-18', 
    content: '🐣 專案初始化，建立基礎專案結構，啟動 LunaTV 私人極致影院開源計畫。' 
  }
];

// 自動摘取最新的一筆（即 v2.0.2）
export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v2.0.2';