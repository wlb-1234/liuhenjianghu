FROM node:20-slim

WORKDIR /app

COPY server/package*.json ./

RUN npm install --production=false

COPY server/ ./

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
