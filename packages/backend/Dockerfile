FROM node:20-alpine AS builder

WORKDIR /build

COPY . .

RUN npm ci

RUN cd packages/backend && npx prisma generate

RUN npm run build --workspace=packages/backend

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /build/packages/backend/dist ./packages/backend/dist
COPY --from=builder /build/packages/backend/prisma ./packages/backend/prisma
COPY --from=builder /build/packages/backend/public ./packages/backend/public
COPY --from=builder /build/packages/shared ./packages/shared
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package.json ./package.json
COPY --from=builder /build/packages/backend/package.json ./packages/backend/package.json
COPY --from=builder /build/packages/shared/package.json ./packages/shared/package.json

EXPOSE 4000

ENV NODE_ENV=production

WORKDIR /app/packages/backend

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]