# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
# Instala apenas dependências de produção e o prisma client
RUN npm install --omit=dev && npx prisma generate

EXPOSE 3001
CMD ["node", "dist/server.js"]
