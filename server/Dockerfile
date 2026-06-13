# Railway 强制重新构建 - $(date)
FROM node:20-slim

RUN apt-get update && apt-get install -y curl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

# 先复制package.json
COPY package*.json ./

# 安装依赖
RUN pnpm install --ignore-scripts

# 复制源代码
COPY . ./

# 构建项目
RUN pnpm run build

# 调试：确保dist/data目录存在
RUN ls -la dist/ || echo "dist not found"
RUN ls -la dist/data/ || echo "dist/data not found"
RUN cat dist/data/regions.json | head -c 500 || echo "regions.json not found"

EXPOSE 5000

CMD ["pnpm", "start"]
