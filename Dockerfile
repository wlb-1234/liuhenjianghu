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

# 调试：确保dist/data目录存在
RUN ls -la dist/ || echo "dist not found"
RUN ls -la dist/data/ || echo "dist/data not found"
RUN cat dist/data/regions.json 2>/dev/null | head -c 500 || echo "regions.json not found in dist/data"

# 同时检查src/data
RUN ls -la src/data/ || echo "src/data not found"
RUN cat src/data/regions.json 2>/dev/null | head -c 500 || echo "regions.json not found in src/data"

# 检查是否还有node-cache
RUN ls node_modules/ 2>/dev/null | grep -v node-cache || echo "no unwanted packages"

EXPOSE 8080

ENV PORT=8080

CMD ["pnpm", "start"]
