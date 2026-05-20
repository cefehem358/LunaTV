export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

export const CHANGELOGS: ChangelogItem[] = [
  { 
    version: 'v2.1.0', 
    date: '2026-05-20', 
    content: '🎉 釋出 v2.1.0 完美收官版！修正設置按鈕路由至 /profile，徹底解決 404 找不到網頁錯誤，全功能（設置、管理、登出、版本號）完美對接通電。' 
  },
  { 
    version: 'v2.0.9', 
    date: '2026-05-20', 
    content: '導入 Next.js useRouter 核心導航，拔除測試用 alert 彈窗。' 
  }
];

export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v2.1.0';