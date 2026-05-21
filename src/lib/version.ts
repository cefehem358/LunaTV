export interface ChangelogItem {
  version: string;
  date: string;
  content: string;
}

export const CHANGELOGS: ChangelogItem[] = [
  {
    version: 'v1.4.3',
    date: '2026-05-21',
    content:
      '重構搜尋核心請求邏輯，引入「關鍵字極簡化切片」機制，在發起 API 請求前自動裁切冗長片名至核心詞（如：木頭風紀委員 → 風紀委員），徹底解決因譯名差異或字串過長導致搜尋不到片源的致命缺陷。',
  },
  {
    version: 'v1.4.2',
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
