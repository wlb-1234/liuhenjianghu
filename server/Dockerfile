FROM node:20-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

# 复制 server 目录的 package.json
COPY server/package*.json ./

RUN pnpm install --ignore-scripts

# 复制 server 源代码
COPY server/ ./

# 构建
RUN pnpm run build

EXPOSE 5000

CMD ["pnpm", "start"]
