<div align="center">
  <img src="https://picsum.photos/200/200?random=tv" alt="LunaTV Logo" width="120" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(255, 62, 108, 0.3);"/>
  
  # 📺 LunaTV
  
  ### ✨ 專為大螢幕與電視盒子打造的「磨砂玻璃微光風」極致流媒體播放器 ✨
  
  [![Version](https://img.shields.io/badge/version-v1.3.2-ff3e6c?style=for-the-badge)](https://github.com/Berserker8888/LunaTV/releases)
  [![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
  [![Platform](https://img.shields.io/badge/platform-Next.js%20%7C%20Tailwind-black?style=for-the-badge)](https://nextjs.org/)

  <p align="center">
    <a href="#-介面預覽">介面預覽</a> •
    <a href="#-特色功能">特色功能</a> •
    <a href="#-快速開始">快速開始</a> •
    <a href="#-配置指南">配置指南</a> •
    <a href="#-更新日誌">更新日誌</a>
  </p>
</div>

---

## 📖 專案簡介

**LunaTV** 是一款基於 Next.js、Tailwind CSS 與 TypeScript 開發的現代化影視配置與播放終端。專為電視盒子、平板與大螢幕（10-Foot UI）深度優化。

在 **v1.3.2** 中，我們全面引入了全新的 **Stellar Glass（磨砂玻璃微光風）** 設計語言，修復了電視遙控器（D-Pad）在橫向滾動時的焦點邊界限制。現在不論是繼續觀看區還是熱門電影，皆支援實體滑動控制與防切邊聚焦放大動效，給您媲美 Netflix 的沉浸式觀影體驗。

---

## 📸 介面預覽

> 💡 *小提示：專案完美支援網頁端、平板端與 Android 電視盒子端。*

| 🏠 磨砂玻璃首頁 | 🎬 縱向標準海報牆 (v1.3.2) |
|---|---|
| <img src="https://raw.githubusercontent.com/Berserker8888/LunaTV/main/public/preview-home.jpg" width="400" alt="首頁"/> | <img src="https://raw.githubusercontent.com/Berserker8888/LunaTV/main/public/preview-grid.jpg" width="400" alt="海報牆"/> |

| 📺 播放器與雙欄選集控制 | ⚙️ 核心配置編輯器 |
|---|---|
| <img src="https://raw.githubusercontent.com/Berserker8888/LunaTV/main/public/preview-player.jpg" width="400" alt="播放器"/> | <img src="https://raw.githubusercontent.com/Berserker8888/LunaTV/main/public/preview-editor.jpg" width="400" alt="編輯器"/> |

---

## ✨ 特色功能

- 🎨 **Stellar Glass 視覺語彙：** 採用高斯模糊與 `#ff3e6c` 霓虹粉紅作為核心焦點色，配合 1.08x 的優雅放大與外發光呼吸燈動效。
- 📺 **電視遙控器（D-Pad）完美導航：** 繼續觀看區導入與熱門電影一致的橫向滑動 Slider，配合實體控制箭頭與焦點自動滾入視野，左右滑動極致絲滑，放大不切邊。
- 🍿 **縱向標準海報牆：** 繼續觀看區與最新上架全面採用標準 `aspect-[2/3]` 比例，徹底杜絕影劇封面橫向變形。
- 📅 **動漫日曆原生整合：** `/bangumi` 路由自動與豆瓣動漫基礎架構融合，提供自適應響應式網格（2 至 7 欄）。
- 🏷️ **本地端「最愛標籤系統」：** 內建 `favorite-tags.client.ts` 模組，完全不依賴後端伺服器，利用 `localStorage` 實現自訂標籤名稱、顏色與卡片一鍵歸類。
- 🖼️ **子母畫面（PiP）：** 播放頁面支援一鍵懸浮畫中畫模式（支援遙控器快捷鍵 `P` 鍵觸發）。
- 🇹🇼 **台灣在地化視覺優化：** 載入 `Noto Sans TC` 字體變體，大幅提升繁體中文字元在大螢幕上的視認性。

---

## 🚀 快速開始

### 本地開發環境建立

確保您的電腦已安裝 [Node.js](https://nodejs.org/)（建議 v18 以上）。

```bash
# 1. 複製專案
git clone https://github.com/Berserker8888/LunaTV.git

# 2. 進入專案目錄
cd LunaTV

# 3. 安裝依賴套件
npm install
# 或者使用 pnpm
pnpm install

# 4. 啟動本地開發伺服器
npm run dev
# 或者
pnpm dev
```

開啟瀏覽器訪問 `http://localhost:3000` 即可開始使用。

### Docker 一鍵部署

```bash
docker run -d \
  --name lunatv \
  -p 3000:3000 \
  berserker8888/lunatv:latest
```

---

## ⚙️ 配置指南

LunaTV 的設定可透過以下方式自訂：

1. **環境變數：** 複製 `.env.example` 為 `.env.local` 並填入對應的值。
2. **運行時配置：** 支援 `RUNTIME_CONFIG` 動態注入（自訂分類、啟用直播等）。
3. **設置頁面：** 前端 `/settings` 頁面提供圖形化介面調整豆瓣數據代理、圖片代理與搜尋開關。

---

## 📋 更新日誌

| 版本 | 日期 | 內容 |
|------|------|------|
| v1.3.2 | 2026-05-21 | 重構繼續觀看區塊的滾動架構，引進與熱門電影相同的橫向 Slider 控制器與實體箭頭，徹底修復電視端遙控器左右導航卡死問題 |
| v1.3.1 | 2026-05-21 | 修正繼續觀看區塊的遙控器 D-pad 橫向滾動邊界與焦點移動邏輯 |
| v1.1.0 | 2026-05-21 | 番劇日曆整合至動漫頻道、我的片單分類標籤系統、播放器子母畫面按鈕 |
| v1.0.9 | 2026-05-21 | 播放器增強：自動連播開關、快捷鍵幫助面板、繼續觀看卡牌文字縮小 |
| v1.0.8 | 2026-05-21 | 全面 UI/UX 優化：主題一致性修復、手機篩選折疊、底部導航加入搜尋 |
| v1.0.7 | 2026-05-20 | 修復 Docker 建置失敗：deps 階段跳過 husky install、拆分建置步驟 |
| v1.0.6 | 2026-05-20 | 統一 Netflix 紅色主題、修正搜尋/播放/直播/設定頁顏色不一致、簡體轉繁體 |
| v1.0.5 | 2026-05-20 | 建立 /settings 本地設置頁面（豆瓣數據代理、圖片代理、搜尋與播放開關） |
| v1.0.4 | 2026-05-20 | 重新設計登入頁面 - 電影級動態背景、發光按鈕、掃描線效果 |
| v1.0.3 | 2026-05-20 | 重新設計選集/換源 UI - Netflix 風格標籤、圓角按鈕、發光當前標記 |
| v1.0.2 | 2026-05-20 | 移除生產環境 console.log 除錯代碼 |
| v1.0.1 | 2026-05-20 | 修正設定按鈕 404 錯誤 - 路由從 /profile 改為 /admin |

---

<div align="center">
  <sub>Built with ❤️ using Next.js & Tailwind CSS</sub>
  <br/>
  <sub>© 2026 LunaTV — 本專案僅供學習與研究用途</sub>
</div>
