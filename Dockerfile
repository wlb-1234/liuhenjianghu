# 流痕江湖 - Railway 部署

FROM node:20-slim AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@9.0.0

# 复制 package.json
COPY package.json pnpm-lock.yaml* ./
COPY server/package.json ./server/

# 先安装依赖
RUN pnpm install --frozen-lockfile || pnpm install

# 复制源代码
COPY . .

# 构建后端
WORKDIR /app/server
RUN pnpm run build

# 运行阶段
FROM node:20-slim

WORKDIR /app

# 只复制生产依赖
COPY package.json pnpm-lock.yaml* ./
COPY server/package.json ./server/

RUN npm install -g pnpm@9.0.0 && \
    pnpm install --prod --frozen-lockfile || pnpm install --prod

# 复制构建产物
COPY --from=builder /app/server/dist ./dist

# 创建 uploads 目录
RUN mkdir -p uploads

EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

CMD ["sh", "-c", "cd server && pnpm run start"]
