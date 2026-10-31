# ============================================================
# Monafaseh — Production Dockerfile (multi-stage build)
# ============================================================
# سه مرحله:
#   1. deps — نصب نسخه‌های قفل‌شده با Bun که از npm دریافت می‌شود
#   2. builder — build کردن Next.js + Prisma client با Node 22
#   3. runner — اجرای Next.js با Node 22 و فقط فایل‌های لازم
#
# تصویر نهایی بر پایه‌ی node:22-alpine است.
# شامل:
#   • Next.js standalone server
#   • Prisma client + migrations
#   • sharp برای پردازش تصویر
#   • SQLite database (با volume mount برای persistence)
# ============================================================

# ─── Stage 1: deps ────────────────────────────────────────────
FROM node:22-alpine AS deps

# دریافت نسخه‌ی دقیق Bun از npm registry؛ این مرحله فقط برای نصب dependencyها است.
RUN npm install --global --no-audit --no-fund bun@1.3.4

WORKDIR /app

# کپی manifest و lockfile واقعی پروژه برای cache بهتر
COPY package.json bun.lock ./

# نصب نسخه‌های دقیق ثبت‌شده در bun.lock
RUN bun install --frozen-lockfile

# ─── Stage 2: builder ─────────────────────────────────────────
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

# کپی node_modules از stage deps
COPY --from=deps /app/node_modules ./node_modules

# کپی کد منبع
COPY . .

# متغیرهای محیطی برای build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/db/custom.db"

# تولید Prisma client
# میرور داخلی برای دانلود موتور (در ایران binaries.prisma.sh گاهی SSL نمی‌دهد)
ENV PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh
RUN npx prisma generate || (npx prisma generate --no-engine && npx prisma generate)

# وابستگی‌های ترانزیتی Prisma CLI برای اجرای db push در image نهایی
RUN mkdir -p /app/prisma-cli-deps/node_modules/@standard-schema && \
    for package in c12 chokidar citty confbox consola deepmerge-ts defu destr dotenv effect empathic exsolve fast-check giget jiti node-fetch-native nypm ohash pathe perfect-debounce pkg-types pure-rand rc9 readdirp tinyexec; do \
      cp -a "/app/node_modules/$package" /app/prisma-cli-deps/node_modules/; \
    done && \
    cp -a /app/node_modules/@standard-schema/spec /app/prisma-cli-deps/node_modules/@standard-schema/

# build کردن Next.js (با output: standalone برای تصویر سبک‌تر)
RUN npm run build

# ─── Stage 3: runner ──────────────────────────────────────────
FROM node:22-alpine AS runner

# سازگاری glibc برای ابزارهای Node روی Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

# متغیرهای محیطی
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL="file:/app/db/custom.db"

# ایجاد کاربر غیر-root برای امنیت
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# npm run build places public and .next/static under standalone, so copying the
# standalone output is sufficient and avoids storing those files twice.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp

# کپی entrypoint script
COPY --chown=nextjs:nodejs --chmod=755 docker-entrypoint.sh /app/docker-entrypoint.sh

# ایجاد پوشه‌ی دیتابیس و uploads با ownership درست
RUN mkdir -p /app/db /app/public/uploads/ads /app/public/uploads/avatars /app/public/uploads/blog && \
    chown nextjs:nodejs /app/db /app/public/uploads /app/public/uploads/ads /app/public/uploads/avatars /app/public/uploads/blog

# Volume برای persistence دیتابیس و uploads
VOLUME ["/app/db", "/app/public/uploads"]

# تغییر به کاربر غیر-root
USER nextjs

# پورت
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# Entry point
CMD ["/app/docker-entrypoint.sh"]

# ─── Stage 4: one-shot schema migrator ────────────────────────
# Keep Prisma CLI and its schema-engine dependencies out of the long-running
# Next.js image. deploy.sh runs this small utility image once, then removes it.
FROM node:22-alpine AS migrator

RUN apk add --no-cache libc6-compat && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/db/custom.db"

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma-cli-deps/node_modules/ ./node_modules/

USER nextjs
CMD ["node", "./node_modules/prisma/build/index.js", "db", "push", "--accept-data-loss"]
