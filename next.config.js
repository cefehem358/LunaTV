/** @type {import('next').NextConfig} */
/* eslint-disable @typescript-eslint/no-var-requires */

const nextConfig = {
  output: process.platform === 'win32' ? undefined : 'standalone',
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: true, // 1C1G 小機器優化：編譯時忽略 ESLint，防止記憶體不足崩潰
  },
  typescript: {
    ignoreBuildErrors: true, // 1C1G 小機器優化：編譯時忽略 TS 檢查，防止 OOM
  },

  reactStrictMode: false,
  swcMinify: true, // 1C1G 小機器優化：啟用 SWC 壓縮（Rust 引擎），大幅節省記憶體與時間
  productionBrowserSourceMaps: false, // 1C1G 小機器優化：關閉 Source Map 以減少打包時的記憶體佔用

  experimental: {
    instrumentationHook: process.env.NODE_ENV === 'production',
    webpackMemoryOptimizations: true, // 1C1G 小機器優化：開啟 Webpack 記憶體優化
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@headlessui/react',
      'swiper',
    ], // 優化模組載入
  },

  // Uncoment to add domain whitelist
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },

  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg')
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: { not: /\.(css|scss|sass)$/ },
        resourceQuery: { not: /url/ }, // exclude if *.svg?url
        loader: '@svgr/webpack',
        options: {
          dimensions: false,
          titleProp: true,
        },
      }
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      crypto: false,
    };

    return config;
  },
};

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA(nextConfig);
