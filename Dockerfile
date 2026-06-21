# 前端 Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json
COPY client/package.json client/pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --ignore-scripts

# 复制前端代码
COPY client/ ./

# 设置环境变量
ENV EXPO_PUBLIC_BACKEND_BASE_URL=https://liuhenjianghu.com
ENV NODE_ENV=production

# 构建
RUN pnpm run web:build

# 启动服务 (npx serve 是最简单的静态文件服务器)
EXPOSE 8080

CMD ["npx", "serve", "dist", "-l", "8080", "-s"]
