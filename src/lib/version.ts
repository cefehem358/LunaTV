export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

export const CHANGELOGS: ChangelogItem[] = [
  { 
    version: 'v2.0.6', 
    date: '2026-05-20', 
    content: '🎉 釋出 v2.0.6 動態解鎖版！為「設置」、「管理面板」、「登出」綁定實質動作回應，解除點擊無功能回應的空包彈狀態。' 
  },
  { 
    version: 'v2.0.5', 
    date: '2026-05-20', 
    content: '修正 UserMenu 與 VersionPanel 之間的屬性接通死角。' 
  }
];

export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v2.0.6';