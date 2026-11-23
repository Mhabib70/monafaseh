<div dir="rtl">

# 🌙 منافسه — پلتفرم مسابقات تلاوت قرآن

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-149ECA?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/WebRTC-Jitsi-333333?logo=webrtc" alt="WebRTC" />
  <img src="https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white" alt="PWA" />
</p>

**منافسه** پلتفرم زندهٔ تلاوت و رقابت قرآنی است: محافل زنده با نوبت‌دهی خودکار، چالش ۱به‌۱ قاریان، احراز سطح‌بندی‌شدهٔ قاریان، جلسات خصوصی با اساتید و پروفایل اجتماعی هر قاری — همراه با پرداخت واقعی و تسویهٔ بانکی. 🎙📖

🌐 **سایت اصلی:** [monafaseh.vodda.ir](https://monafaseh.vodda.ir) · 🧪 **نسخهٔ آزمایشی:** [monafaseh-2](https://github.com/Mhabib70/monafaseh-2)

## 🆕 آخرین به‌روزرسانی‌ها (نوامبر ۲۰۲۶)

- 👤 **پروفایل اینستاگرامی قاریان** — گالری تصاویر با فشرده‌سازی خودکار، شبکه‌های اجتماعی، مدارج و آمار (همگام‌سازی از production)
- 🎨 **لوگوی برند نسخهٔ ۲** + آیکون‌های جدید PWA و سرویس‌ورکر `sw2`
- 📦 snapshot کامل production (اکتبر–نوامبر ۲۰۲۶) با همهٔ قابلیت‌های زندهٔ سایت

## ✨ امکانات

- 🎙 **محافل زندهٔ تلاوت** — نوبت‌دهی خودکار بین حاضران، نمایش همزمان متن قرآن، صدا و تصویر (WebRTC/Jitsi)
- ⚔️ **چالش رقابت آنلاین** — رقابت ۱به‌۱ بین قاریان با داوری و تحسین (تهمید)
- 🏅 **احراز قاری با تیک‌های سطح‌بندی** — 🥉 برنزی (استانی) / 🥈 نقره‌ای (کشوری) / 🥇 طلایی (بین‌المللی)
- 👤 **پروفایل اینستاگرامی هر قاری** — گالری، شبکه‌های اجتماعی، مدارج و آمار
- 💼 **جلسات خصوصی پولی با اساتید** — قاری قیمت می‌گذارد، دانشجو با امتیاز رزرو می‌کند، تسویهٔ بانکی انجام می‌شود
- 💳 **خرید امتیاز** — درگاه سامان کیش (SEP شاپرک، توکن‌محور: token → callback → verify) + حمایت مالی
- 💬 **تالار گفتگو** با پیام صوتی
- 📰 **فید اجتماعی + بلاگ** با نظرات
- 📢 **سامانهٔ تبلیغات** — جایگاه‌های تبلیغ (AdSlot)، آمار روزانه و مدیریت تبلیغ‌دهندگان
- ✉️ **دعوت‌ها و یکپارچگی با ایتا**
- 📱 **PWA** — نصب روی گوشی با لوگوی اختصاصی + تم روشن/تاریک
- 🛡 **پنل ادمین** — احراز قاریان، پرداخت‌ها، تسویه‌ها، گزارش‌ها و آمار سایت

## 🏗 معماری و تکنولوژی

| لایه | تکنولوژی |
| --- | --- |
| 🖥 فرانت‌اند | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Zustand |
| ⚙️ بک‌اند | API Routes (sessions, challenge, credits, payment, settlement, lounges, blog, ads, admin, …) |
| 🗄 دیتابیس | SQLite + Prisma ORM (۲۶ مدل) |
| 🔐 احراز هویت | NextAuth + bcryptjs |
| 🎥 رسانهٔ زنده | WebRTC / Jitsi |
| 💳 پرداخت | درگاه سامان کیش (SEP شاپرک) — `src/lib/payment/` |
| 🔤 زبان و RTL | فارسی · چیدمان کاملاً راست‌به‌چپ |

## 🚀 راه‌اندازی سریع

```bash
# ۱) نصب وابستگی‌ها
npm install            # یا: bun install

# ۲) متغیرهای محیطی
cp .env.example .env   # مقادیر را تنظیم کنید (دیتابیس، NextAuth، درگاه پرداخت)

# ۳) آماده‌سازی دیتابیس
npx prisma generate
npx prisma db push

# ۴) اجرای توسعه
npm run dev            # http://localhost:3000
```

## 🐳 استقرار با Docker

سرویس Docker منافسه همراه سایر سرویس‌های ودا از ریشهٔ مخزن مدیریت می‌شود — جزئیات کامل در [DEPLOYMENT.md](DEPLOYMENT.md):

- 🧪 **اجرای محلی:** `./debug.sh up-d` → منافسه روی `http://localhost:3423` (پورت میزبان با `MONAFASEH_PORT` در `.env.local` قابل تغییر است)
- 🌐 **استقرار:** `MONAFASEH_NEXTAUTH_URL` و `MONAFASEH_SITE_URL` را در `.env.production` روی دامنهٔ نهایی تنظیم کنید؛ secret جدا با `MONAFASEH_NEXTAUTH_SECRET` (در غیر این صورت `JWT_SECRET` ودا). سپس `./deploy.sh deploy`
- 🔒 پورت داخلی `3000` و پورت میزبان `3423` فقط روی `127.0.0.1` منتشر می‌شود؛ reverse proxy دامنه باید به `127.0.0.1:3423` وصل شود
- 💾 **نگه‌داری داده:** SQLite و آپلودها در volumeهای `monafaseh_monafaseh-db` و `monafaseh_monafaseh-uploads` ذخیره می‌شوند؛ `./debug.sh reset` آن‌ها را حذف نمی‌کند. ⚠️ پیش از حذف دستی volumeها backup بگیرید

## 📂 ساختار پروژه

```
├── src/app/            # صفحات و API (App Router) — admin, api, …
├── src/app/api/        # sessions, challenge, credits, payment, settlement, lounges, blog, ads, verify, …
├── src/components/     # کامپوننت‌های UI
├── src/lib/payment/    # درگاه سامان کیش (token → callback → verify)
├── prisma/             # اسکیمای دیتابیس (SQLite — ۲۶ مدل)
├── public/icons/       # آیکون‌های PWA (نسخهٔ v2)
├── scripts/            # اسکریپت‌های نگهداری و seed
├── Dockerfile          # ایمیج production
└── DEPLOYMENT.md       # راهنمای استقرار Docker
```

## 🔗 مخازن مرتبط

- 🧪 [monafaseh-2](https://github.com/Mhabib70/monafaseh-2) — سندباکس مستقل برای آزمایش ایده‌ها (snapshot کامل production)

> 🔒 هرگز فایل‌های `.env` واقعی، `db/` و `public/uploads/` را کامیت نکنید (gitignore آماده است).

</div>

---

<div dir="ltr">

## 🌍 English Summary

**Monafaseh** — a live Quran recitation & competition platform (Persian, full RTL). Live at [monafaseh.vodda.ir](https://monafaseh.vodda.ir).

- 🎙 **Live recitation circles** with automatic turn-taking, synchronized Quran text, audio and video (WebRTC/Jitsi).
- ⚔️ **1-on-1 reciter competitions** with praise (Tahmeed) and judging.
- 🏅 **Tiered reciter verification** — bronze (provincial) / silver (national) / gold (international).
- 👤 **Instagram-style reciter profiles** — auto-compressed image gallery, social links, credentials and stats (Nov 2026 update, plus brand logo v2 and new PWA icons).
- 💼 **Paid private master sessions** — masters set prices, students book with credits, bank settlements for masters.
- 💳 **Real payments** via Saman Kish (SEP/Shaparak) token-based gateway + donations.
- 💬 Voice-message lounges, 📰 social feed + blog, 📢 ad slots with daily stats, ✉️ invitations & Eitaa integration.
- 📱 Installable **PWA** with light/dark themes; 🛡 admin panel for verification, payments, settlements and reports.
- 🧱 **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Zustand · NextAuth · Prisma + SQLite (26 models).
- 🐳 Dockerized deployment alongside the Vodda stack — see [DEPLOYMENT.md](DEPLOYMENT.md) (host port `3423`, persistent DB/uploads volumes).

**Quick start:** `npm install` → `cp .env.example .env` → `npx prisma generate && npx prisma db push` → `npm run dev` → http://localhost:3000

</div>
