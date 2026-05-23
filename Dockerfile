# 流痕江湖 - Railway 部署

FROM node:20-slim AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@9.0.0

# 复制 package.json
COPY package.json pnpm-lock.yaml ./
COPY server/package.json ./server/

# 先安装依赖（不用 frozen-lockfile）
RUN pnpm install

# 复制源代码
COPY . .

# 构建后端
WORKDIR /app/server
RUN pnpm run build

# 运行阶段
FROM node:20-slim

WORKDIR /app

# 只复制 package.json
COPY server/package.json ./server/

# 安装生产依赖（不用 frozen-lockfile）
RUN npm install -g pnpm@9.0.0 && pnpm install --prod

# 复制构建产物
COPY --from=builder /app/server/dist ./dist

# 创建 uploads 目录
RUN mkdir -p uploads

EXPOSE 5000

CMD ["sh", "-c", "cd server && node dist/index.js"]
