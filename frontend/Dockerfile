FROM oven/bun:canary-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:canary-alpine

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --production

COPY --from=builder /app/build ./build

EXPOSE 5173

USER bun

CMD ["bun", "./build/index.js"]
