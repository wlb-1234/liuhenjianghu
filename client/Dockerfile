# 前端 Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json（构建上下文已经是 client 目录）
COPY package.json pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --ignore-scripts

# 复制前端代码
COPY . .

# 设置环境变量
ENV EXPO_PUBLIC_BACKEND_BASE_URL=https://liuhenjianghu.com
ENV NODE_ENV=production

# 构建
RUN pnpm run build

# 启动服务
EXPOSE 8080

CMD ["npx", "serve", "dist", "-l", "8080", "-s"]
