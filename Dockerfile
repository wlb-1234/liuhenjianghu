# 流痕江湖 - Railway 部署

FROM node:20-slim

WORKDIR /app

# 复制 package.json
COPY package.json ./
COPY server/package.json ./server/

# 安装依赖（使用npm避免pnpm问题）
WORKDIR /app/server
RUN npm install

# 返回主目录
WORKDIR /app

# 复制其余源代码
COPY . .

# 构建后端
WORKDIR /app/server
RUN npm run build || echo "Build skipped"

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["sh", "-c", "node dist/index.js"]
