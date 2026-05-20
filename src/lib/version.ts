export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

// 2026 旗艦配置：變更日誌歷史數據（在此處統一維護）
export const CHANGELOGS: ChangelogItem[] = [
  { version: 'v1.0.8', date: '2026-05-20', content: '重構動漫番劇與劇場版切換邏輯，修復海報卡牌無法顯示之 Bug。' },
  { version: 'v1.0.7', date: '2026-05-20', content: '修復首頁「最新上架」連續刷新偶發性卡死問題。' },
  { version: 'v1.0.6', date: '2026-05-20', content: '修復普通與劇場版播放介面人數統計顯示溢出問題。' },
  { version: 'v1.0.4', date: '2026-05-20', content: '優化影視採集站後端 API 連線機制，提升解析速度。' },
  { version: 'v1.0.3', date: '2026-05-20', content: '主頁面換裝 Netflix 全暗黑高質感電影感風格 UI。' }
];

// 核心修復：當前最新版本號直接動態摘取陣列第一項，徹底拔除寫死的 v1.0.6！
export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v1.0.8';