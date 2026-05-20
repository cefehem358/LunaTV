export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

export const CHANGELOGS: ChangelogItem[] = [
  { 
    version: 'v2.0.1', 
    date: '2026-05-20', 
    content: '🎉 發布 v2.0.1 終極修正補丁！強制更新雲端緩存，徹底移除前台 UserMenu 的靜態黃點提醒與 vv 拼字衝突。' 
  },
  { 
    version: 'v2.0.0', 
    date: '2026-05-20', 
    content: '整合原生高效繁簡字典，全站完美繁體化，修復 Hydration 衝突與 UserMenu 引入漏洞。' 
  },
  { version: 'v1.0.9', date: '2026-05-20', content: '優化「繼續觀看」面板，整合高質感「片源資訊標籤」。' },
  { version: 'v1.0.8', date: '2026-05-20', content: '重構動漫專區篩選狀態機，修復番劇與劇場版海報顯示 Bug。' }
];

// 自動摘取最新的一筆（即 v2.0.1）
export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v2.0.1';