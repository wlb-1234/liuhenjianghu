FROM node:20-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

COPY server/package*.json ./

RUN pnpm install --ignore-scripts

COPY server/ ./

RUN pnpm run build

EXPOSE 8080

CMD ["node", "dist/index.js"]
