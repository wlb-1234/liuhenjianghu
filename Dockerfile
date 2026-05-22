# 流痕江湖 - Railway 部署
# Dockerfile for Railway deployment

FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-lock.yaml* ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建服务端
WORKDIR /app/server
RUN pnpm run build

# 最终镜像
FROM node:20-alpine

WORKDIR /app

# 安装生产依赖
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# 复制构建产物
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package.json ./

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

# 启动命令
CMD ["sh", "-c", "pnpm run start"]
