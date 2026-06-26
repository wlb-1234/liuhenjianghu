# Railway 缓存清除测试 - 2026-06-26 16:35
FROM node:22-bookworm AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
ENV EXPO_PUBLIC_BACKEND_BASE_URL=https://server-production-d2bda.up.railway.app
RUN npm run build
FROM nginx:1.27-bookworm
RUN rm -rf /etc/nginx/conf.d/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
