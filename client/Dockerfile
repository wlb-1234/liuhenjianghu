# Railway 缓存清除 - 使用全新的基础镜像
FROM node:22-bookworm AS builder

WORKDIR /app

# 复制 package.json 和 scripts 目录
COPY package.json ./
COPY scripts/ ./scripts/

# 安装依赖（使用 --legacy-peer-deps 避免 peer 依赖冲突）
RUN npm install --legacy-peer-deps

# 安装缺失的 fontawesome 依赖
RUN npm install @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-regular-svg-icons --legacy-peer-deps

# 复制所有源代码
COPY . .

# 设置环境变量用于构建
ENV EXPO_PUBLIC_BACKEND_BASE_URL=https://liuhenjianghu.com

# 构建 Expo Web 应用
RUN npm run build

# 第二阶段：使用 nginx 提供服务
FROM nginx:1.27-bookworm

# 删除默认的 nginx 配置
RUN rm -rf /etc/nginx/conf.d/*

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从第一阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
