#!/bin/bash
# Package the Monafaseh project into a clean, downloadable zip.
# Excludes: node_modules, .next, .git, dev.log, build artifacts, internal tooling.
# Includes: full source code, public assets, prisma schema, scripts, config files.

set -euo pipefail

PROJECT_ROOT="/home/z/my-project"
STAGE_DIR="/tmp/monafaseh-pkg-stage"
PKG_NAME="monafaseh-project"
STAGE_PATH="$STAGE_DIR/$PKG_NAME"
OUTPUT_ZIP="/home/z/my-project/download/$PKG_NAME.zip"

# Clean previous stage
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_PATH"

echo "==> Staging project files into $STAGE_PATH ..."

# ─── Copy source code & configs ──────────────────────────────────────────────
cp -r "$PROJECT_ROOT/src" "$STAGE_PATH/src"
cp -r "$PROJECT_ROOT/public" "$STAGE_PATH/public"
cp -r "$PROJECT_ROOT/prisma" "$STAGE_PATH/prisma"
cp -r "$PROJECT_ROOT/scripts" "$STAGE_PATH/scripts"
cp -r "$PROJECT_ROOT/examples" "$STAGE_PATH/examples"
cp -r "$PROJECT_ROOT/tests" "$STAGE_PATH/tests"

# Config files
cp "$PROJECT_ROOT/package.json" "$STAGE_PATH/"
cp "$PROJECT_ROOT/bun.lock" "$STAGE_PATH/"
cp "$PROJECT_ROOT/tsconfig.json" "$STAGE_PATH/"
cp "$PROJECT_ROOT/next.config.ts" "$STAGE_PATH/"
cp "$PROJECT_ROOT/tailwind.config.ts" "$STAGE_PATH/"
cp "$PROJECT_ROOT/postcss.config.mjs" "$STAGE_PATH/"
cp "$PROJECT_ROOT/eslint.config.mjs" "$STAGE_PATH/"
cp "$PROJECT_ROOT/components.json" "$STAGE_PATH/"
cp "$PROJECT_ROOT/Caddyfile" "$STAGE_PATH/"
cp "$PROJECT_ROOT/.gitignore" "$STAGE_PATH/"
cp "$PROJECT_ROOT/next-env.d.ts" "$STAGE_PATH/"

# Database file (small, useful for inspection)
mkdir -p "$STAGE_PATH/db"
cp "$PROJECT_ROOT/db/custom.db" "$STAGE_PATH/db/" 2>/dev/null || true

# Worklog (development history — useful reference)
cp "$PROJECT_ROOT/worklog.md" "$STAGE_PATH/"

# ─── Create .env.example (no real secrets — current .env only has DATABASE_URL) ─
cat > "$STAGE_PATH/.env.example" << 'EOF'
# Database (SQLite for development — file-based, no server needed)
DATABASE_URL="file:./db/custom.db"

# NextAuth.js — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="change-me-to-a-random-32-char-string"
NEXTAUTH_URL="http://localhost:3000"

# Bale bot (optional — only needed for admin bot)
BOT_TOKEN=""
SITE_URL="http://localhost:3000"
EOF

# Also include the actual .env (since it only contains DATABASE_URL — no secrets)
cp "$PROJECT_ROOT/.env" "$STAGE_PATH/.env"

# ─── Create README with setup instructions ───────────────────────────────────
cat > "$STAGE_PATH/README.md" << 'EOF'
# منافسه — پلتفرم مسابقات تلاوت قرآن

پلتفرم کامل برای برگزاری محافل تلاوت تصویری، چالش رقابت قاریان، تالار گفتگو، و بلاگ.

## شروع سریع

```bash
# 1. نصب وابستگی‌ها
bun install        # یا: npm install

# 2. کپی فایل env
cp .env.example .env

# 3. ساخت دیتابیس
bunx prisma generate
bunx prisma db push

# 4. اجرای سرور توسعه
bun run dev        # یا: npm run dev
```

سپس مرورگر را روی http://localhost:3000 باز کنید.

## پیش‌نیازها

- Node.js 18+ (یا Bun)
- مرورگر مدرن (Chrome/Safari/Edge) — برای دسترسی به دوربین
- اتصال اینترنت (برای STUN/TURN سرورهای WebRTC)

## ساختار پروژه

```
monafaseh-project/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes (REST)
│   │   │   ├── auth/           # ورود/ثبت‌نام/لاگ‌اوت
│   │   │   ├── sessions/       # محافل تلاوت
│   │   │   ├── challenge/      # چالش رقابت
│   │   │   ├── lounges/        # تالار گفتگو
│   │   │   ├── blog/           # بلاگ
│   │   │   ├── admin/          # پنل مدیریت
│   │   │   └── ...
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── noorcraft/          # کامپوننت‌های اختصاصی منافسه
│   │   │   ├── views/          # صفحات اصلی
│   │   │   │   ├── landing-view.tsx
│   │   │   │   ├── auth-view.tsx
│   │   │   │   ├── dashboard-view.tsx
│   │   │   │   ├── sessions-view.tsx
│   │   │   │   ├── session-room-view.tsx
│   │   │   │   ├── challenge-view.tsx
│   │   │   │   ├── lounge-view.tsx
│   │   │   │   ├── blog-view.tsx
│   │   │   │   └── admin-view.tsx
│   │   │   ├── webrtc-video-chat.tsx     # جلسه تصویری (PeerJS/WebRTC)
│   │   │   ├── quran-display.tsx         # نمایش آیه قرآن
│   │   │   ├── recitation-flow.tsx       # گردش تلاوت
│   │   │   └── ...
│   │   └── ui/                 # shadcn/ui کامپوننت‌ها
│   ├── store/                  # Zustand state stores
│   │   ├── noor-store.ts       # user, view, session state
│   │   └── recitation-store.ts # competition state
│   ├── lib/                    # utilities
│   │   ├── auth.ts             # NextAuth config
│   │   ├── db.ts               # Prisma client
│   │   ├── challenge-store.ts  # in-memory challenge state
│   │   └── noorcraft/          # types, constants, rules
│   └── data/                   # mock data
├── public/
│   ├── avatars/                # تصاویر آواتار پیش‌فرض
│   ├── fonts/                  # فونت‌های فارسی (Lalezar, Baloo Bhaijaan, Amiri)
│   ├── images/                 # تصاویر استاتیک
│   └── uploads/                # آپلودهای کاربران (avatars, blog images)
├── prisma/
│   └── schema.prisma           # مدل‌های دیتابیس
├── scripts/                    # اسکریپت‌های کمکی
├── examples/                   # نمونه WebSocket (server/client)
├── tests/                      # تست‌های runtime
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── .env.example
```

## قابلیت‌ها

- ✅ ورود/ثبت‌نام با email + password
- ✅ داشبورد شخصی با آمار و نشان‌ها
- ✅ ساخت/پیوستن به محافل تلاوت تصویری (WebRTC)
- ✅ چالش رقابت (Random Rival Match)
- ✅ تالار گفتگو (Lounge) با چت متنی
- ✅ بلاگ با لایک/دیس‌لایک/کامنت
- ✅ پنل مدیریت (Admin) — مدیریت کاربران، محافل، آمار
- ✅ نمایش زنده آیه قرآن حین تلاوت
- ✅ محدودیت جنسیتی (آقایان/بانوان جدا)
- ✅ دعوت کاربران آنلاین به محافل
- ✅ حالت تاریک (Dark mode)
- ✅ ریسپانسیو موبایل

## تکنولوژی‌ها

| بخش | تکنولوژی |
|------|----------|
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui, Framer Motion |
| Backend | Next.js API Routes (REST) |
| Database | SQLite + Prisma ORM |
| Auth | NextAuth.js (credentials) |
| Video | WebRTC + PeerJS (STUN + TURN) |
| State | Zustand |
| Fonts | Lalezar, Baloo Bhaijaan 2, Amiri Quran |

## دیپلوی

### Vercel (ساده‌ترین)
```bash
npx vercel
```

### VPS با PM2
```bash
npm run build
pm2 start "npm run start" --name monafaseh
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

## عیب‌یابی

### دوربین کار نمی‌کند
- مطمئن شوید سایت روی `https://` باز می‌شود (یا `localhost`)
- دسترسی دوربین را در مرورگر Allow کنید
- اگر از مرورگر داخلی اپ‌ها (اینستاگرام، تلگرام و...) باز می‌کنید، لینک را در Chrome/Safari اصلی باز کنید

### ویدیو رقیب وصل نمی‌شود
- هر دو طرف باید وارد session-room شوند
- برای چالش‌ها، ویدیو خودکار شروع می‌شود
- اگر باز هم نشد، F12 بزنید و لاگ‌های `[WebRTC]` را بررسی کنید
- TURN server اضافه شده برای کاربران پشت symmetric NAT

## توسعه

### ساخت کاربر ادمین
```bash
bun run scripts/seed.ts
```

### بررسی تایپ
```bash
npx tsc --noEmit
```

### اجرای لینت
```bash
bun run lint
```

## لایسنس

این پروژه به‌صورت اختصاصی برای پلتفرم منافسه توسعه یافته است.

## تماس

برای سوالات و گزارش باگ، به آدرس پروژه مراجعه کنید.
EOF

echo "==> staged files:"
du -sh "$STAGE_PATH"
echo ""
echo "==> file count:"
find "$STAGE_PATH" -type f | wc -l

# ─── Create the zip ──────────────────────────────────────────────────────────
echo ""
echo "==> Creating zip: $OUTPUT_ZIP"
rm -f "$OUTPUT_ZIP"
cd "$STAGE_DIR"
zip -r "$OUTPUT_ZIP" "$PKG_NAME" -q

echo ""
echo "==> Final zip info:"
ls -lh "$OUTPUT_ZIP"
echo ""
echo "==> Zip contents (top-level):"
unzip -l "$OUTPUT_ZIP" | head -20

# Cleanup stage
rm -rf "$STAGE_DIR"

echo ""
echo "✅ Done. Download: $OUTPUT_ZIP"
