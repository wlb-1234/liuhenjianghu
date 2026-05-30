# 流痕江湖 - Railway 部署（简化版）

FROM node:20-slim

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@9.0.0

# 复制 package.json
COPY package.json pnpm-lock.yaml ./
COPY server/package.json ./server/

# 安装依赖
RUN pnpm install --prod

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["sh", "-c", "cd server && node dist/index.js"]
