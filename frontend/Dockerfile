FROM oven/bun:1.2.22 AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:1.2.22 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5173
ENV ORIGIN=http://localhost:5173

COPY package.json pnpm-lock.yaml ./

RUN bun install --frozen-lockfile --production

COPY --from=builder /app/build ./build

EXPOSE 5173

USER bun

CMD ["bun", "./build/index.js"]
