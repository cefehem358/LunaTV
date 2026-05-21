# 📺 LunaTV

<div align="center">
  <img src="public/logo.png" alt="LunaTV Logo" width="120">
</div>

> 🎬 **LunaTV** 是一个开箱即用的、跨平台的影视聚合播放器。它基于 **Next.js 14** + **Tailwind&nbsp;CSS** + **TypeScript** 构建，支持多资源搜索、在线播放、收藏同步、播放记录、云端存储，让你可以随时随地畅享海量免费影视内容。

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-000?logo=nextdotjs)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-4.x-3178c6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)
![Docker Ready](https://img.shields.io/badge/Docker-ready-blue?logo=docker)

</div>

---

### ⚠️ 注意：部署后项目为空壳项目，无内置播放源和直播源，需要自行收集

<details>
  <summary>点击查看项目截图</summary>
  <img src="public/screenshot1.png" alt="项目截图" style="max-width:600px">
  <img src="public/screenshot2.png" alt="项目截图" style="max-width:600px">
  <img src="public/screenshot3.png" alt="项目截图" style="max-width:600px">
</details>

---

## 🗺 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [部署](#部署)
  - [Docker 部署](#docker-部署)
  - [Kvrocks 存储（推荐）](#kvrocks-存储推荐)
  - [Redis 存储](#redis-存储)
- [配置文件](#配置文件)
- [环境变量](#环境变量)
- [自动更新](#自动更新)
- [安全与隐私提醒](#安全与隐私提醒)
- [License](#license)
- [致谢](#致谢)
- [Star History](#star-history)

## ✨ 功能特性

- 🔍 **多源聚合搜索**：一次搜索立刻返回全源结果。
- 📄 **丰富详情页**：支持剧集列表、演员、年份、简介等完整信息展示。
- ▶️ **流畅在线播放**：集成 HLS.js & ArtPlayer。
- ❤️ **收藏 + 继续观看**：支持 Kvrocks/Redis 存储，多端同步进度。
- 📱 **PWA**：离线缓存、安装到桌面/主屏，移动端原生体验。
- 🌗 **响应式布局**：桌面侧边栏 + 移动底部导航，自适应各种屏幕尺寸。
- 📺 **TV 优化**：专为大银幕与电视盒子深度优化，支持遥控器 D-pad 导航、全高度防误触边缘遮罩栏。
- 🎨 **磨砂玻璃视觉**：高斯模糊面板 + 霓虹焦点色 + 呼吸灯动效，打造沉浸式观影体验。

## 技术栈

| 分类      | 主要依赖                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------- |
| 前端框架  | [Next.js 14](https://nextjs.org/) · App Router                                                        |
| UI & 样式 | [Tailwind&nbsp;CSS 3](https://tailwindcss.com/)                                                       |
| 语言      | TypeScript                                                                                            |
| 播放器    | [ArtPlayer](https://github.com/zhw2590582/ArtPlayer) · [HLS.js](https://github.com/video-dev/hls.js/) |
| 代码质量  | ESLint · Prettier                                                                                     |
| 部署      | Docker                                                                                                |

## 部署

本项目**仅支持 Docker 或其他基于 Docker 的平台** 部署。

请将以下配置中的 `YOUR_GITHUB_USERNAME` 替换为您的 GitHub 帐号名称。

### Kvrocks 存储（推荐）

> **优点：** 基于 RocksDB 的高性能键值数据库，磁盘持久化存储，重启或升级时数据不丢失，适合长期稳定使用。

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

### Redis 存储

> **注意：** Redis 默认为内存存储，重启容器会导致数据丢失。若需持久化请自行配置 `save` 指令或启用 AOF。

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

## 配置文件

完成部署后为空壳应用，无播放源，需要站长在管理后台的配置文件设置中填写配置文件。

配置文件示例如下：

```json
{
  "cache_time": 7200,
  "api_site": {
    "dyttzy": {
      "api": "http://xxx.com/api.php/provide/vod",
      "name": "示例资源",
      "detail": "http://xxx.com"
    }
  },
  "custom_category": [
    {
      "name": "华语",
      "type": "movie",
      "query": "华语"
    }
  ]
}
```

- `cache_time`：接口缓存时间（秒）。
- `api_site`：你可以增删或替换任何资源站，字段说明：
  - `api`：资源站提供的 `vod` JSON API 根地址。
  - `name`：在人机界面中展示的名称。
  - `detail`：（可选）部分无法通过 API 获取剧集详情的站点，需要提供网页详情根 URL，用于爬取。
- `custom_category`：自定义分类配置，用于在导航中添加个性化的影视分类。以 `type` + `query` 作为唯一标识。支持以下字段：
  - `name`：分类显示名称（可选，如不提供则使用 `query` 作为显示名）
  - `type`：分类类型，支持 `movie`（电影）或 `tv`（电视剧）
  - `query`：搜索关键词，用于在豆瓣 API 中搜索相关内容

`custom_category` 支持的自定义分类如下：

- **movie**：热门、最新、经典、豆瓣高分、冷门佳片、华语、欧美、韩国、日本、动作、喜剧、爱情、科幻、悬疑、恐怖、治愈
- **tv**：热门、美剧、英剧、韩剧、日剧、国产剧、港剧、日本动画、综艺、纪录片

也可输入如 "哈利波特" 效果等同于豆瓣搜索。

MoonTV 支持标准的苹果 CMS V10 API 格式。

## 环境变量

| 变量                                | 说明                                         | 可选值                           | 默认值                                                                                                                     |
| ----------------------------------- | -------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| USERNAME                            | 站长账号                                     | 任意字符串                       | 无默认，必填                                                                                                               |
| PASSWORD                            | 站长密码                                     | 任意字符串                       | 无默认，必填                                                                                                               |
| SITE_BASE                           | 站点 URL                                     | 形如 https://example.com         | 空                                                                                                                         |
| NEXT_PUBLIC_SITE_NAME               | 站点名称                                     | 任意字符串                       | LunaTV                                                                                                                     |
| ANNOUNCEMENT                        | 站点公告                                     | 任意字符串                       | 本网站仅提供影视信息搜索服务，所有内容均来自第三方网站。本站不存储任何视频资源，不对任何内容的准确性、合法性、完整性负责。 |
| NEXT_PUBLIC_STORAGE_TYPE            | 播放记录/收藏的存储方式                      | redis、kvrocks                   | 无默认，必填                                                                                                               |
| KVROCKS_URL                         | Kvrocks 连接 URL                             | 连接 URL                         | 空                                                                                                                         |
| REDIS_URL                           | Redis 连接 URL                               | 连接 URL                         | 空                                                                                                                         |
| NEXT_PUBLIC_SEARCH_MAX_PAGE         | 搜索接口可拉取的最大页数                     | 1-50                             | 5                                                                                                                          |
| NEXT_PUBLIC_DOUBAN_PROXY_TYPE       | 豆瓣数据源请求方式                           | 见下方                           | direct                                                                                                                     |
| NEXT_PUBLIC_DOUBAN_PROXY            | 自定义豆瓣代理 URL                           | URL prefix                       | 空                                                                                                                         |
| NEXT_PUBLIC_DOUBAN_IMAGE_PROXY_TYPE | 豆瓣图片代理类型                             | 见下方                           | direct                                                                                                                     |
| NEXT_PUBLIC_DOUBAN_IMAGE_PROXY      | 自定义豆瓣图片代理 URL                       | URL prefix                       | 空                                                                                                                         |
| NEXT_PUBLIC_DISABLE_YELLOW_FILTER   | 关闭色情内容过滤                             | true/false                       | false                                                                                                                      |

`NEXT_PUBLIC_DOUBAN_PROXY_TYPE` 选项解释：

- `direct`：由服务器直接请求豆瓣源站
- `cmliussss-cdn-tencent`：浏览器向豆瓣 CDN 请求数据，该 CDN 由 [CMLiussss](https://github.com/cmliu) 搭建，并由腾讯云 CDN 提供加速
- `cmliussss-cdn-ali`：浏览器向豆瓣 CDN 请求数据，该 CDN 由 [CMLiussss](https://github.com/cmliu) 搭建，并由阿里云 CDN 提供加速
- `custom`：用户自定义 proxy，由 `NEXT_PUBLIC_DOUBAN_PROXY` 定义

`NEXT_PUBLIC_DOUBAN_IMAGE_PROXY_TYPE` 选项解释：

- `direct`：由浏览器直接请求豆瓣分配的默认图片域名
- `server`：由服务器代理请求豆瓣分配的默认图片域名
- `cmliussss-cdn-tencent`：由浏览器请求豆瓣 CDN，该 CDN 由 [CMLiussss](https://github.com/cmliu) 搭建，并由腾讯云 CDN 提供加速
- `cmliussss-cdn-ali`：由浏览器请求豆瓣 CDN，该 CDN 由 [CMLiussss](https://github.com/cmliu) 搭建，并由阿里云 CDN 提供加速
- `custom`：用户自定义 proxy，由 `NEXT_PUBLIC_DOUBAN_IMAGE_PROXY` 定义

## 自动更新

可借助 [watchtower](https://github.com/containrrr/watchtower) 自动更新镜像容器。

dockge/komodo 等 Docker Compose UI 也有自动更新功能。

## 🚀 本地开发

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/LunaTV.git
cd LunaTV
pnpm install
pnpm dev
```

开启浏览器访问 `http://localhost:3000`。

## 安全与隐私提醒

### 请设置密码保护并关闭公网注册

为了您的安全和避免潜在的法律风险，我们要求在部署时**强烈建议关闭公网注册**：

#### 部署要求

1. **设置环境变量 `PASSWORD`**：为您的实例设置一个强密码
2. **仅供个人使用**：请勿将您的实例链接公开分享或传播
3. **遵守当地法律**：请确保您的使用行为符合当地法律法规

#### 重要声明

- 本项目仅供学习和个人使用
- 请勿将部署的实例用于商业用途或公开服务
- 如因公开分享导致的任何法律问题，用户需自行承担责任
- 项目开发者不对用户的使用行为承担任何法律责任
- 本项目不在中国大陆地区提供服务。如有该项目在向中国大陆地区提供服务，属个人行为。在该地区使用所产生的法律风险及责任，属于用户个人行为，与本项目无关，须自行承担全部责任。特此声明

## License

[MIT](LICENSE) © 2026 LunaTV & Contributors

## 致谢

- [ts-nextjs-tailwind-starter](https://github.com/theodorusclarence/ts-nextjs-tailwind-starter) — 项目最初基于该脚手架。
- [LibreTV](https://github.com/LibreSpark/LibreTV) — 由此启发，站在巨人的肩膀上。
- [ArtPlayer](https://github.com/zhw2590582/ArtPlayer) — 提供强大的网页视频播放器。
- [HLS.js](https://github.com/video-dev/hls.js) — 实现 HLS 流媒体在浏览器中的播放支持。
- [CMLiussss](https://github.com/cmliu) — 提供豆瓣 CDN 服务
- 感谢所有提供免费影视接口的站点。

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=YOUR_GITHUB_USERNAME/LunaTV&type=Date)](https://www.star-history.com/#YOUR_GITHUB_USERNAME/LunaTV&Date)
