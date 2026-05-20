export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

// v2.0.0 終極里程碑：準確反映專案核心變更
export const CHANGELOGS: ChangelogItem[] = [
  { 
    version: 'v2.0.0', 
    date: '2026-05-20', 
    content: '🎉 釋出 2.0.0 完全體正式版！\n1. 【修復】版本面板（VersionPanel）與右上角選單開關點擊連動、手動關閉邏輯，終結無限跳出迴圈。\n2. 【修復】首頁「最新上架」查看更多（跳轉分頁）異常問題，打通前台路由。\n3. 【修正】動漫專區「番劇」與「劇場版」之分組 API 參數，恢復海報卡牌網格顯示。\n4. 【新增】「繼續觀看」卡牌面板全面升級，於片名下方成功整合高質感「片源資訊標籤」。' 
  },
  { version: 'v1.0.7', date: '2026-05-20', content: '優化全站繁簡原生字典映射（nativeS2T），消滅 Vercel 部署衝突。' },
  { version: 'v1.0.6', date: '2026-05-20', content: '首頁全新換裝致敬 Netflix 奢華暗黑風格 UI，整合毛玻璃狀態列。' },
  { version: 'v0.0.1', date: '2026-05-18', content: '專案初始化，啟動 LunaTV 私人極致影院開源計畫。' }
];

// 自動動態導出當前最新版本號，徹底拔除硬編碼卡死！
export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v2.0.0';