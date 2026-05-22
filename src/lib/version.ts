export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

export const CHANGELOGS: ChangelogItem[] = [
  {
    version: 'v1.5.4',
    date: '2026-05-22',
    content: `
- 修正「動漫」首頁片源進入搜尋時的別名過濾匹配問題
- 新增首頁「繼續觀看」區塊的一鍵清空按鈕
- 版本號提升至 0.1.1
    `.trim(),
  },
  {
    version: 'v1.5.3',
    date: '2026-05-23',
    content:
      '大規模全面除蟲：修復 31 個 Bug。關鍵修復包含：(1) 播放頁集數還原時序競爭導致「看到第5集下次變第4集」—— initFromHistory 改用 currentSource/currentId 依賴觸發，同步更新 ref 並加入 saveLockRef 防止 timeupdate 覆寫正確紀錄；(2) 修正 downstream.ts yearText 重複宣告的語法錯誤；(3) 搜尋引擎 multi-char S2T 映射表無法匹配多字詞問題；(4) SSE 元件卸載後仍在處理資料；(5) history delete API Object.keys(null) 崩潰及 source 精確比對；(6) NetflixHome handleDelete null item 崩潰及 key 精確比對刪除；(7) playrecord 點擊時 stitle 遺失與 currentEpisode 傳遞；(8) VideoCard search 情境收藏狀態不同步；(9) storage.ts localStorage 模式 hgetall/hdel 空實作；(10) 優化更新失敗 rollback 快取、request-dedupe timeout、handleSourceChange 保留 stitle/stype URL 參數、auto-next 防重入。',
  },
  {
    version: 'v1.5.2',
    date: '2026-05-21',
    content:
      '全面修復搜尋引擎三大問題：(1) 修正 cleanQueryForApi 過度裁切搜尋關鍵字的 Bug（原本以「和」/「與」切割、截第 2-6 字），恢復長劇名卡牌正常搜尋片源；(2) 將 isFuzzyMatch 升級為 LCS 嚴格比對，徹底根治「點 A 搜尋出 B」的搜尋污染問題；(3) 恢復聚合模式下的篩選器（filteredAggResults），使來源/年份/標題過濾器在聚合視圖中正常運作。',
  },
  {
    version: 'v1.5.1',
    date: '2026-05-21',
    content:
      '收緊模糊比對（LCS）匹配條件，規定最長公共子字串長度必須大於等於 4 且重合比例大於等於 50%，修復「電影中的女孩」等短劇名片源誤匹配長劇名（如「和班上第二可愛的女孩成為了朋友」）的搜尋問題。',
  },
  {
    version: 'v1.5.0',
    date: '2026-05-21',
    content:
      '新增動漫頻道與新番放送卡牌搜尋容錯機制。引入 Longest Common Substring (LCS) 模糊劇名比對算法，以及搜尋關鍵字自動縮短/退路重試邏輯，徹底解決因片名微幅差異（如「女女孩」與「女孩子」）導致無法匹配片源的問題。',
  },
  {
    version: 'v1.4.9',
    date: '2026-05-21',
    content:
      '徹底修復歷史紀錄通訊鏈。校正點擊跳轉之原始 ID 傳遞引數，避免播放頁 404 崩潰；同步補齊 /api/history/delete 路由，實作點擊 X 鈕異步抹除歷史快取與前端卡片實時蒸發。',
  },
  {
    version: 'v1.4.8',
    date: '2026-05-21',
    content:
      '實作「純劇名絕對去重」機制，無視片源差異僅保留最新觀看紀錄；並在繼續觀看卡片右上角新增「手動刪除按鈕」，提升歷史紀錄管理靈活性。',
  },
  {
    version: 'v1.4.7',
    date: '2026-05-21',
    content:
      '修正片源標籤圖標重複與文字冗餘的視覺 Bug；並升級歷史紀錄去重算法，引入「繁簡轉換與模糊劇名相似度識別」機制，完美解決譯名差異導致繼續觀看重複的問題。',
  },
  {
    version: 'v1.3.7',
    date: '2026-05-21',
    content:
      '完美校正繼續觀看卡片的細節樣式，修復片源膠囊標籤內部置中問題，並優化字體垂直行距與視覺呼吸感。',
  },
  {
    version: 'v1.3.6',
    date: '2026-05-21',
    content:
      '優化繼續觀看卡片的元數據排版，精簡片源標籤文字，並重構觀看進度為「當前進度 / 最新集數」對比格式，提升追劇直覺性。',
  },
  {
    version: 'v1.3.5',
    date: '2026-05-21',
    content:
      '參考 Netflix 佈局重構橫向 Slider，引入「全高度垂直防誤觸邊緣遮罩欄」，徹底根治網頁端滑鼠點擊控制項時誤觸影片卡牌跳轉的 Bug。',
  },
  {
    version: 'v1.3.4',
    date: '2026-05-21',
    content:
      '重構橫向 Slider 滾動架構，將控制項全面升級為「大尺寸高對比純白按鈕 (bg-white text-black)」，徹底解決網頁端滑鼠找不到按鍵、難以點擊翻頁的問題；並將 README 重構為通用變數版本，導入 Kvrocks 與 Redis 雙方案 Docker 部署規範。',
  },
  {
    version: 'v1.3.3',
    date: '2026-05-21',
    content:
      '重構繼續觀看區塊的滾動架構，引進與熱門電影相同的橫向 Slider 控制器與實體箭頭，徹底修復電視端遙控器左右導航卡死問題；並於 README 導入個人倉庫之 Kvrocks 與 Redis 雙版本 Docker 部署規範。',
  },
  {
    version: 'v1.3.2',
    date: '2026-05-21',
    content:
      '重構繼續觀看區塊的滾動架構，引進與熱門電影相同的橫向 Slider 控制器與實體箭頭，徹底修復電視端遙控器左右導航卡死問題。',
  },
  {
    version: 'v1.3.1',
    date: '2026-05-21',
    content:
      '修正繼續觀看區塊的遙控器 D-pad 橫向滾動邊界與焦點移動邏輯，全面優化 10-Foot UI 電視端導航體驗。',
  },
  {
    version: 'v1.1.0',
    date: '2026-05-21',
    content:
      '番劇日曆整合至動漫頻道、我的片單分類標籤系統、播放器子母畫面按鈕。',
  },
  {
    version: 'v1.0.9',
    date: '2026-05-21',
    content:
      '播放器增強：自動連播開關（可記憶）、快捷鍵幫助面板（?/H 鍵顯示）、繼續觀看卡牌文字縮小。',
  },
  {
    version: 'v1.0.8',
    date: '2026-05-21',
    content:
      '全面 UI/UX 優化：主題一致性修復、手機篩選折疊、側欄折疊 tooltip、底部導航加入搜尋、橫向捲動手機提示。',
  },
  {
    version: 'v1.0.7',
    date: '2026-05-20',
    content:
      '修復 Docker 建置失敗：deps 階段跳過 husky install（無 .git）、拆分建置步驟以利除錯。',
  },
  {
    version: 'v1.0.6',
    date: '2026-05-20',
    content:
      '統一 Netflix 紅色主題：修正搜索頁、播放器、直播頁、設定頁、卡片等處綠色/藍色不一致；修正愛心圖示顏色；簡體中文轉繁體。',
  },
  {
    version: 'v1.0.5',
    date: '2026-05-20',
    content:
      '建立 /settings 本地設置頁面（豆瓣數據代理、圖片代理、搜索與播放開關）、修正設定按鈕路由。',
  },
  {
    version: 'v1.0.4',
    date: '2026-05-20',
    content:
      '重新設計登入頁面 - 電影級動態背景、發光按鈕、掃描線效果、全新視覺層級。',
  },
  {
    version: 'v1.0.3',
    date: '2026-05-20',
    content:
      '重新設計選集/換源 UI - Netflix 風格標籤、圓角按鈕、發光當前標記、更好的響應式佈局。',
  },
  {
    version: 'v1.0.2',
    date: '2026-05-20',
    content: '移除生產環境 console.log 除錯代碼。',
  },
  {
    version: 'v1.0.1',
    date: '2026-05-20',
    content: '修正設定按鈕 404 錯誤 - 路由從 /profile 改為 /admin。',
  },
];

export const CURRENT_VERSION = CHANGELOGS[0]?.version || 'v1.0.4';
