# 全新构建 - 2026-06-26
# 不使用缓存，从头开始构建

FROM node:20-slim AS builder

WORKDIR /app

# 复制 package.json
COPY package.json ./

# 使用 npm 安装依赖
RUN npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 设置构建环境变量
ARG EXPO_PUBLIC_BACKEND_BASE_URL=https://server-production-d2bda.up.railway.app
ENV EXPO_PUBLIC_BACKEND_BASE_URL=${EXPO_PUBLIC_BACKEND_BASE_URL}

# 构建应用
RUN npm run build

# 运行阶段
FROM nginx:1.25-alpine

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
