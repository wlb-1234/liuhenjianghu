# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制根目录的 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --ignore-scripts

# 复制所有源代码
COPY . .

# 设置环境变量（构建时）
ARG EXPO_PUBLIC_BACKEND_BASE_URL
ENV EXPO_PUBLIC_BACKEND_BASE_URL=${EXPO_PUBLIC_BACKEND_BASE_URL}

# 构建 Expo Web 应用
RUN pnpm run build

# 运行阶段 - 使用 nginx
FROM nginx:alpine

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口（Railway 使用 PORT 环境变量）
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
