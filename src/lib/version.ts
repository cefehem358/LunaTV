export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

export const CHANGELOGS: ChangelogItem[] = [
  { 
    version: 'v2.0.9', 
    date: '2026-05-20', 
    content: '🚀 釋出 v2.0.9 旗艦真跳轉版！拔除 alert 假測試彈窗，導入 Next.js useRouter 核心導航。設置、管理面板、登出全面綁定實質路由跳轉與狀態清空，達成 100% 完全體。' 
  },
  { 
    version: 'v2.0.8', 
    date: '2026-05-20', 
    content: '對齊 MoonTechLab 官方原生組件規範與 Lucide 圖示。' 
  }
];

export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v2.0.9';