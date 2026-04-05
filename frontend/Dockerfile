FROM node:20-alpine AS base

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --cache /tmp/npm-cache

COPY . .

# 开发模式
EXPOSE 3000
CMD ["npm", "run", "dev"]
