# 📺 LunaTV

<div align="center">
  <img src="public/logo.png" alt="LunaTV Logo" width="120">
</div>

> 🎬 **LunaTV** 是一款開箱即用的跨平台影視聚合播放器。基於 **Next.js 14** + **Tailwind&nbsp;CSS** + **TypeScript** 構建，支援多來源搜索、在線播放、收藏同步、播放記錄、雲端儲存，讓你隨時隨地暢享海量免費影視內容。

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-000?logo=nextdotjs)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-4.x-3178c6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)
![Docker Ready](https://img.shields.io/badge/Docker-ready-blue?logo=docker)

</div>

---

### ⚠️ 注意：部署後專案為空殼，無內建播放源，需要自行收集

<details>
  <summary>點擊查看專案截圖</summary>
  <img src="public/screenshot1.png" alt="專案截圖" style="max-width:600px">
  <img src="public/screenshot2.png" alt="專案截圖" style="max-width:600px">
  <img src="public/screenshot3.png" alt="專案截圖" style="max-width:600px">
</details>

---

## 🗺 目錄

- [功能特性](#功能特性)
- [技術棧](#技術棧)
- [部署](#部署)
  - [Docker 部署](#docker-部署)
  - [Kvrocks 儲存（推薦）](#kvrocks-儲存推薦)
  - [Redis 儲存](#redis-儲存)
- [設定檔](#設定檔)
- [環境變數](#環境變數)
- [自動更新](#自動更新)
- [安全與隱私提醒](#安全與隱私提醒)
- [License](#license)
- [致謝](#致謝)
- [Star History](#star-history)

## ✨ 功能特性

- 🔍 **多來源聚合搜索**：一次搜索立刻返回全來源結果。
- 📄 **豐富詳情頁**：支援劇集列表、演員、年份、簡介等完整資訊展示。
- ▶️ **流暢在線播放**：整合 HLS.js 與 ArtPlayer。
- ❤️ **收藏 + 繼續觀看**：支援 Kvrocks/Redis 儲存，多端同步進度。
- 📱 **PWA**：離線快取、安裝到桌面/主畫面，行動端原生體驗。
- 🌗 **響應式佈局**：桌面側邊欄 + 行動底部導航，自適應各種螢幕尺寸。
- 📺 **TV 優化**：專為大銀幕與電視盒子深度優化，支援遙控器 D-pad 導航、全高度防誤觸邊緣遮罩欄。
- 🎨 **磨砂玻璃視覺**：高斯模糊面板 + 霓虹焦點色 + 呼吸燈動效，打造沉浸式觀影體驗。

## 技術棧

| 分類      | 主要依賴                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------- |
| 前端框架  | [Next.js 14](https://nextjs.org/) · App Router                                                        |
| UI & 樣式 | [Tailwind&nbsp;CSS 3](https://tailwindcss.com/)                                                       |
| 語言      | TypeScript                                                                                            |
| 播放器    | [ArtPlayer](https://github.com/zhw2590582/ArtPlayer) · [HLS.js](https://github.com/video-dev/hls.js/) |
| 程式碼品質 | ESLint · Prettier                                                                                     |
| 部署      | Docker                                                                                                |

## 部署

本專案**僅支援 Docker 或其他基於 Docker 的平台**部署。

請將以下設定檔中的 `berserker8888` 替換為您的 GitHub 帳號名稱。

### Kvrocks 儲存（推薦）

> **優點：** 基於 RocksDB 的高效能鍵值資料庫，磁碟持久化儲存，重啟或升級時資料不遺失，適合長期穩定使用。

```yaml
services:
  moontv-core:
    image: ghcr.io/berserker8888/lunatv:latest
    container_name: moontv-core
    restart: on-failure
    ports:
      - '3000:3000'
    environment:
      - USERNAME=admin
      - PASSWORD=admin_password
      - NEXT_PUBLIC_STORAGE_TYPE=kvrocks
      - KVROCKS_URL=redis://moontv-kvrocks:6666
    networks:
      - moontv-network
    depends_on:
      - moontv-kvrocks

  moontv-kvrocks:
    image: apache/kvrocks
    container_name: moontv-kvrocks
    restart: unless-stopped
    volumes:
      - kvrocks-data:/var/lib/kvrocks
    networks:
      - moontv-network

networks:
  moontv-network:
    driver: bridge

volumes:
  kvrocks-data:
```

### Redis 儲存

> **注意：** Redis 預設為記憶體儲存，重啟容器會導致資料遺失。若需持久化請自行設定 `save` 指令或啟用 AOF。

```yaml
services:
  moontv-core:
    image: ghcr.io/berserker8888/lunatv:latest
    container_name: moontv-core
    restart: on-failure
    ports:
      - '3000:3000'
    environment:
      - USERNAME=admin
      - PASSWORD=admin_password
      - NEXT_PUBLIC_STORAGE_TYPE=redis
      - REDIS_URL=redis://moontv-redis:6379
    networks:
      - moontv-network
    depends_on:
      - moontv-redis

  moontv-redis:
    image: redis:alpine
    container_name: moontv-redis
    restart: unless-stopped
    networks:
      - moontv-network
    volumes:
      - redis-data:/data

networks:
  moontv-network:
    driver: bridge

volumes:
  redis-data:
```

## 設定檔

完成部署後為空殼應用，無播放源，需要站長在管理後台的設定檔中填寫設定檔。

設定檔範例如下：

```json
{
  "cache_time": 7200,
  "api_site": {
    "dyttzy": {
      "api": "http://xxx.com/api.php/provide/vod",
      "name": "示例資源",
      "detail": "http://xxx.com"
    }
  },
  "custom_category": [
    {
      "name": "華語",
      "type": "movie",
      "query": "華語"
    }
  ]
}
```

- `cache_time`：介面快取時間（秒）。
- `api_site`：你可以增刪或替換任何資源站，欄位說明：
  - `api`：資源站提供的 `vod` JSON API 根位址。
  - `name`：在人機介面中展示的名稱。
  - `detail`：（可選）部分無法透過 API 取得劇集詳情的資源站，需要提供網頁詳情根 URL，用於爬取。
- `custom_category`：自訂分類設定，用於在導航中新增個人化的影視分類。以 `type` + `query` 作為唯一識別。支援以下欄位：
  - `name`：分類顯示名稱（可選，如不提供則使用 `query` 作為顯示名）
  - `type`：分類類型，支援 `movie`（電影）或 `tv`（電視劇）
  - `query`：搜尋關鍵字，用於在豆瓣 API 中搜尋相關內容

`custom_category` 支援的自訂分類如下：

- **movie**：熱門、最新、經典、豆瓣高分、冷門佳片、華語、歐美、韓國、日本動作、喜劇、愛情、科幻、懸疑、恐怖、治癒
- **tv**：熱門、美劇、英劇、韓劇、日劇、國產劇、港劇、日本動畫、綜藝、紀錄片

也可輸入如「哈利波特」效果等同於豆瓣搜尋。

MoonTV 支援標準的蘋果 CMS V10 API 格式。

## 環境變數

| 變數                                  | 說明                                       | 可選值                             | 預設值                                                                                                                       |
| ------------------------------------- | ------------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| USERNAME                              | 站長帳號                                   | 任意字串                           | 無預設，必填                                                                                                                 |
| PASSWORD                              | 站長密碼                                   | 任意字串                           | 無預設，必填                                                                                                                 |
| SITE_BASE                             | 站點 URL                                   | 形如 https://example.com           | 空                                                                                                                           |
| NEXT_PUBLIC_SITE_NAME                 | 站點名稱                                   | 任意字串                           | LunaTV                                                                                                                       |
| ANNOUNCEMENT                          | 站點公告                                   | 任意字串                           | 本網站僅提供影視資訊搜尋服務，所有內容均來自第三方網站。本站不儲存任何影片資源，不對任何內容的準確性、合法性、完整性負責。 |
| NEXT_PUBLIC_STORAGE_TYPE              | 播放記錄/收藏的儲存方式                     | redis、kvrocks                      | 無預設，必填                                                                                                                 |
| KVROCKS_URL                           | Kvrocks 連線 URL                           | 連線 URL                           | 空                                                                                                                           |
| REDIS_URL                             | Redis 連線 URL                             | 連線 URL                           | 空                                                                                                                           |
| NEXT_PUBLIC_SEARCH_MAX_PAGE           | 搜尋介面可拉取的最大頁數                   | 1-50                               | 5                                                                                                                            |
| NEXT_PUBLIC_DOUBAN_PROXY_TYPE          | 豆瓣資料來源請求方式                       | 見下方                             | direct                                                                                                                       |
| NEXT_PUBLIC_DOUBAN_PROXY              | 自訂豆瓣代理 URL                           | URL prefix                         | 空                                                                                                                           |
| NEXT_PUBLIC_DOUBAN_IMAGE_PROXY_TYPE   | 豆瓣圖片代理類型                           | 見下方                             | direct                                                                                                                       |
| NEXT_PUBLIC_DOUBAN_IMAGE_PROXY        | 自訂豆瓣圖片代理 URL                       | URL prefix                         | 空                                                                                                                           |
| NEXT_PUBLIC_DISABLE_YELLOW_FILTER     | 關閉色情內容過濾                           | true/false                         | false                                                                                                                        |

`NEXT_PUBLIC_DOUBAN_PROXY_TYPE` 選項說明：

- `direct`：由伺服器直接請求豆瓣源站
- `cmliussss-cdn-tencent`：瀏覽器向豆瓣 CDN 請求資料，該 CDN 由 [CMLiussss](https://github.com/cmliu) 搭建，並由騰訊雲 CDN 提供加速
- `cmliussss-cdn-ali`：瀏覽器向豆瓣 CDN 請求資料，該 CDN 由 [CMLiussss](https://github.com/cmliu) 搭建，並由阿里雲 CDN 提供加速
- `custom`：使用者自訂 proxy，由 `NEXT_PUBLIC_DOUBAN_PROXY` 定義

`NEXT_PUBLIC_DOUBAN_IMAGE_PROXY_TYPE` 選項說明：

- `direct`：由瀏覽器直接請求豆瓣分配的預設圖片網域
- `server`：由伺服器代理請求豆瓣分配的預設圖片網域
- `cmliussss-cdn-tencent`：由瀏覽器請求豆瓣 CDN，該 CDN 由 [CMLiussss](https://github.com/cmliu) 搭建，並由騰訊雲 CDN 提供加速
- `cmliussss-cdn-ali`：由瀏覽器請求豆瓣 CDN，該 CDN 由 [CMLiussss](https://github.com/cmliu) 搭建，並由阿里雲 CDN 提供加速
- `custom`：使用者自訂 proxy，由 `NEXT_PUBLIC_DOUBAN_IMAGE_PROXY` 定義

## 自動更新

可借助 [watchtower](https://github.com/containrrr/watchtower) 自動更新映像檔容器。

dockge/komodo 等 Docker Compose UI 也有自動更新功能。

## 🚀 本地開發

```bash
git clone https://github.com/berserker8888/LunaTV.git
cd LunaTV
pnpm install
pnpm dev
```

開啟瀏覽器存取 `http://localhost:3000`。

## 安全與隱私提醒

### 請設定密碼保護並關閉公網註冊

為了您的安全和避免潛在的法律風險，我們要求在部署時**強烈建議關閉公網註冊**：

#### 部署要求

1. **設定環境變數 `PASSWORD`**：為您的實例設定一個強密碼
2. **僅供個人使用**：請勿將您的實例連結公開分享或傳播
3. **遵守當地法律**：請確保您的使用行為符合當地法律法規

#### 重要聲明

- 本專案僅供學習和個人使用
- 請勿將部署的實例用於商業用途或公開服務
- 如因公開分享導致的任何法律問題，使用者需自行承擔責任
- 專案開發者不對使用者的使用行為承擔任何法律責任
- 本專案不在中國大陸地區提供服務。如有該專案在向中國大陸地區提供服務，屬個人行為。在該地區使用所產生的法律風險及責任，屬於使用者個人行為，與本專案無關，須自行承擔全部責任。特此聲明

## License

[MIT](LICENSE) © 2026 LunaTV & Contributors

## 致謝

- [ts-nextjs-tailwind-starter](https://github.com/theodorusclarence/ts-nextjs-tailwind-starter) — 專案最初基於該腳手架。
- [LibreTV](https://github.com/LibreSpark/LibreTV) — 由此啟發，站在巨人的肩膀上。
- [ArtPlayer](https://github.com/zhw2590582/ArtPlayer) — 提供強大的網頁影片播放器。
- [HLS.js](https://github.com/video-dev/hls.js) — 實現 HLS 流媒體在瀏覽器中的播放支援。
- [CMLiussss](https://github.com/cmliu) — 提供豆瓣 CDN 服務
- 感謝所有提供免費影視介面的資源站。

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=berserker8888/LunaTV&type=Date)](https://www.star-history.com/#berserker8888/LunaTV&Date)