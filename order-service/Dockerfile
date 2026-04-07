# Dockerfile (dùng chung cho product-service và order-service)
# Dùng multi-stage build để giảm kích thước image
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
# Chỉ áp dụng cho product-service (có Prisma)
COPY prisma ./prisma
RUN npx prisma generate

# Stage 2: Production
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY src ./src
COPY package.json ./
EXPOSE 3001
CMD ["node", "src/index.js"]