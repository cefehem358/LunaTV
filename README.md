# 📺 LunaTV

### 專為大螢幕與電視盒子打造的「磨砂玻璃微光風」極致流媒體播放器

- **核心架構：** Next.js | Tailwind CSS | TypeScript
- **資料庫支援：** Apache Kvrocks (推薦) / Redis

---

## 📖 專案簡介

LunaTV 是一款現代化影視配置與播放終端。專為網頁端、電視盒子與大螢幕深度優化。我們引進了標準的縱向海報比例（aspect-[2/3]），並全面支援後端資料庫快取機制與全新設計的高顯性純白 Slider 控制器，徹底修復網頁端滑鼠點擊不便、海報擠壓變形與觀看進度無法保存的問題。

---

## ✨ 特色功能

- **Stellar Glass 視覺語彙：** 採用高斯模糊與 #ff3e6c 霓虹粉紅作為核心焦點色，配合 1.08x 的優雅放大與外發光呼吸燈動效。
- **高顯性純白控制按鈕：** 淘汰傳統難瞄準的隱蔽半透明箭頭，全域引入大尺寸純白底色控制按鈕（text-black bg-white shadow-2xl），在暗色主題下具備極致清晰的網頁點擊辨識度。
- **縱向標準海報牆：** 全面採用標準 2:3 直立比例，徹底杜絕影劇封面橫向變形。
- **後端快取同步：** 支援綁定 Kvrocks/Redis，流暢保存您的「繼續觀看」播放進度、快取時間與標籤資料。
- **子母畫面 (PiP)：** 播放頁面支援一鍵懸浮畫中畫模式（支援快捷鍵 P 鍵觸發）。
- **台灣在地化視認性：** 全域載入 `Noto Sans TC` 字體，大幅提升繁體中文字元在螢幕上的清晰度。

---

## 🐳 Docker Compose 一鍵部署

為了確保「繼續觀看」進度保存與全域快取功能正常運作，LunaTV 必須搭配後端儲存服務。請建立 `docker-compose.yml`，並將其中的 `YOUR_GITHUB_USERNAME` 替換為您的 GitHub 帳號名稱：

### 方案 A：Kvrocks 儲存架構（官方推薦 🌟）
> **優點：** 基於 RocksDB 的高興能鍵值資料庫，硬碟儲存，重啟或升級時資料絕對不丟失，適合長期穩定追劇。

```yaml
version: '3.8'

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

### 方案 B：Redis 儲存架構
> **注意：** Redis 預設為記憶體儲存，重啟容器會導致資料遺失。若需持久化請務必自行配置 `save` 指令或啟用 AOF。

```yaml
version: '3.8'

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
    image: redis:7-alpine
    container_name: moontv-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
    networks:
      - moontv-network

networks:
  moontv-network:
    driver: bridge

volumes:
  redis-data:
```

---

## 🔧 環境變數說明

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `USERNAME` | 管理員帳號 | `admin` |
| `PASSWORD` | 管理員密碼 | `admin_password` |
| `NEXT_PUBLIC_STORAGE_TYPE` | 儲存類型 (`localstorage` / `redis` / `kvrocks`) | `localstorage` |
| `KVROCKS_URL` | Kvrocks 連線字串 (Redis 協定) | `redis://localhost:6666` |
| `REDIS_URL` | Redis 連線字串 | `redis://localhost:6379` |

---

## 🚀 本地開發

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/LunaTV.git
cd LunaTV
pnpm install
pnpm dev
```

開啟瀏覽器訪問 `http://localhost:3000`。

---

## 📋 更新日誌

| 版本 | 日期 | 內容 |
|------|------|------|
| v1.3.4 | 2026-05-21 | 重構橫向 Slider 滾動架構，將控制項全面升級為「大尺寸高對比純白按鈕 (bg-white text-black)」，徹底解決網頁端滑鼠找不到按鍵、難以點擊翻頁的問題；並將 README 重構為通用變數版本，導入 Kvrocks 與 Redis 雙方案 Docker 部署規範 |
| v1.3.3 | 2026-05-21 | 重構繼續觀看區塊的滾動架構，引進與熱門電影相同的橫向 Slider 控制器與實體箭頭，徹底修復電視端遙控器左右導航卡死問題；並於 README 導入個人倉庫之 Kvrocks 與 Redis 雙版本 Docker 部署規範 |
| v1.3.2 | 2026-05-21 | 重構繼續觀看區塊的滾動架構，引進與熱門電影相同的橫向 Slider 控制器與實體箭頭，徹底修復電視端遙控器左右導航卡死問題 |
| v1.3.1 | 2026-05-21 | 修正繼續觀看區塊的遙控器 D-pad 橫向滾動邊界與焦點移動邏輯 |
| v1.1.0 | 2026-05-21 | 番劇日曆整合至動漫頻道、我的片單分類標籤系統、播放器子母畫面按鈕 |
| v1.0.9 | 2026-05-21 | 播放器增強：自動連播開關、快捷鍵幫助面板、繼續觀看卡牌文字縮小 |
| v1.0.8 | 2026-05-21 | 全面 UI/UX 優化：主題一致性修復、手機篩選折疊、底部導航加入搜尋 |
| v1.0.7 | 2026-05-20 | 修復 Docker 建置失敗 |
| v1.0.6 | 2026-05-20 | 統一 Netflix 紅色主題、簡體轉繁體 |
| v1.0.5 | 2026-05-20 | 建立 /settings 本地設置頁面 |
| v1.0.4 | 2026-05-20 | 重新設計登入頁面 |
| v1.0.3 | 2026-05-20 | 重新設計選集/換源 UI |
| v1.0.2 | 2026-05-20 | 移除生產環境 console.log |
| v1.0.1 | 2026-05-20 | 修正設定按鈕 404 錯誤 |

---

<div align="center">
  <sub>© 2026 LunaTV — 本專案僅供學習與研究用途</sub>
</div>
