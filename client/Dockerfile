# 前端构建阶段
FROM node:18-alpine as builder
WORKDIR /app

# 复制 package.json 和依赖
COPY package*.json ./
RUN npm install

# 复制源代码
COPY . .

# 构建 Web 应用
RUN npx expo export --platform web

# 运行阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
