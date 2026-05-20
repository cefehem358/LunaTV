export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

export const CHANGELOGS: ChangelogItem[] = [
  { 
    version: 'v2.0.2', 
    date: '2026-05-20', 
    content: '🎉 釋出 v2.0.2 終極定版！全面重構 UserMenu 核心結構，徹底清除靜態黃點與文字疊加錯誤，達成前台視覺零瑕疵、按鈕 100% 通電境界。' 
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
  }
];

export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v2.0.2';