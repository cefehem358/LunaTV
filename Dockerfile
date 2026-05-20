# ---- Stage 1: 安装依赖 ----
FROM node:20-slim AS deps
WORKDIR /app

# 仅复制依赖清单，提高构建缓存利用率
COPY package.json pnpm-lock.yaml ./

# 使用 corepack 安装 pnpm 并安装依赖
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate && pnpm install --frozen-lockfile --ignore-scripts

# ---- Stage 2: 构建项目 ----
FROM node:20-slim AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
# 复制全部源代码
COPY . .

ENV DOCKER_ENV=true
ENV NEXT_PUBLIC_STORAGE_TYPE=redis
ENV NEXT_TELEMETRY_DISABLED=1

# 生产构建
RUN pnpm run build

# ---- Stage 3: 运行时镜像 ----
FROM node:20-slim AS runner

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DOCKER_ENV=true

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/start.js ./start.js
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "start.js"]
