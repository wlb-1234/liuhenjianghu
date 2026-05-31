FROM node:20-slim

# 安装必要的依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制 package 文件
COPY server/package*.json ./

# 安装依赖（包括 devDependencies，因为 build.js 需要 esbuild）
RUN npm install

# 复制源代码
COPY server/ ./

# 构建
RUN npm run build

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["npm", "start"]
