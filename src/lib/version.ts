export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

export const CHANGELOGS: ChangelogItem[] = [
  { version: 'v2.0.0', date: '2026-05-20', content: '🎉 釋出 2.0.0 終極完全體！整合原生高效繁簡字典，全站完美繁體化，修復 Hydration 衝突與 UserMenu 引入漏洞。' },
  { version: 'v1.0.9', date: '2026-05-20', content: '優化「繼續觀看」卡牌面板，於影片名稱下方成功整合高質感「片源資訊標籤」。' },
  { version: 'v1.0.8', date: '2026-05-20', content: '重構動漫專區篩選狀態機，完美修復番劇與劇場版切換時海報卡牌無法顯示之 Bug。' },
  { version: 'v1.0.6', date: '2026-05-20', content: '首頁全新換裝致敬 Netflix 奢華暗黑風格 UI，整合毛玻璃狀態列與自適應滿版網格。' },
  { version: 'v0.0.1', date: '2026-05-18', content: '專案初始化，啟動私人極致影院開源計畫。' }
];

// 動態摘取最新的一筆（即 v2.0.0），徹底拔除硬編碼卡死！
export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v2.0.0';