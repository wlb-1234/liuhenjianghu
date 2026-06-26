# ==========================================
# 全新构建配置 - 强制清除 Railway 缓存
# 构建时间: 2026-06-26 16:30:00
# ==========================================

FROM node:22-bookworm AS builder

WORKDIR /app

# 复制 package.json
COPY package.json ./

# 使用 npm 安装依赖
RUN npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 设置构建环境变量
ARG EXPO_PUBLIC_BACKEND_BASE_URL=https://server-production-d2bda.up.railway.app
ENV EXPO_PUBLIC_BACKEND_BASE_URL=https://server-production-d2bda.up.railway.app

# 构建应用
RUN npm run build

# 运行阶段 - 使用不同版本的 nginx
FROM nginx:1.27-bookworm

# 删除默认配置
RUN rm -rf /etc/nginx/conf.d/*

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动命令
CMD ["nginx", "-g", "daemon off;"]
