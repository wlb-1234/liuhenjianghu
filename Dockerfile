FROM node:20-slim

RUN apt-get update && apt-get install -y curl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

# 先复制package.json和lock文件
COPY server/package*.json ./

# 清理旧的node_modules（如果有）
RUN rm -rf node_modules pnpm-lock.yaml

# 安装依赖（强制重新安装）
RUN pnpm install --ignore-scripts --force

# 复制server源代码（包括src/data目录）
COPY server/ ./

# 构建项目（会复制data目录到dist/data）
RUN pnpm run build

EXPOSE 8080

ENV PORT=8080

CMD ["pnpm", "start"]
