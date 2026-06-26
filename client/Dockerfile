# 流痕江湖前端 Dockerfile - 强制清除缓存版本
# 使用完全不同的基础镜像来绕过 Railway 的缓存机制
# cache-bust: 2026-06-26-1745

# 构建阶段
FROM node:22-bookworm AS builder

WORKDIR /app

# 复制 package.json 和 scripts 目录（postinstall 需要）
COPY package.json ./
COPY scripts/ ./scripts/

# 安装依赖（使用 --legacy-peer-deps 避免依赖冲突）
RUN npm install --legacy-peer-deps

# 复制所有源代码
COPY . .

# 设置环境变量（构建时）
ENV EXPO_PUBLIC_BACKEND_BASE_URL=https://server-production-d2bda.up.railway.app

# 构建 Expo Web 应用
RUN npm run build

# 生产阶段
FROM nginx:1.27-bookworm

# 删除默认配置
RUN rm -rf /etc/nginx/conf.d/*

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制 dist 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口 80
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
