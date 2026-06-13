FROM node:20-slim

RUN apt-get update && apt-get install -y curl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

# 先复制package.json
COPY server/package*.json ./

# 安装依赖
RUN pnpm install --ignore-scripts

# 复制server源代码
COPY server/ ./

# 构建项目
RUN pnpm run build

# 确保dist目录存在
RUN ls -la dist/ || echo "dist not found"

EXPOSE 5000

CMD ["pnpm", "start"]
