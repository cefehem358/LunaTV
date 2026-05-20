export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

export const CHANGELOGS: ChangelogItem[] = [
  { 
    version: 'v2.0.8', 
    date: '2026-05-20', 
    content: '🎉 釋出 v2.0.8 旗艦完全體！完美對齊 MoonTechLab 官方原生組件規範與 Lucide 圖示。修復設置、管理面板、安全登出點擊事件，完美復原紅紫漸層「站」字頭像。' 
  },
  { 
    version: 'v2.0.7', 
    date: '2026-05-20', 
    content: '全盤接通設置與版本號點擊，防禦海報層點擊攔截缺陷。' 
  }
];

export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v2.0.8';