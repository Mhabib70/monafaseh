#!/bin/sh
# ============================================================
# docker-entrypoint.sh — اسکریپت راه‌اندازی container
# ============================================================
# وظایف:
#   ۱. اجرای seed (در صورت خالی بودن دیتابیس)
#   ۲. استارت Next.js standalone server
# ============================================================
set -e

echo "🚀 Starting Monafaseh container..."

# ─── ۱. Seed (فقط اگر دیتابیس خالی است) ─────────────────────
echo "🌱 Checking if seed is needed..."

# بررسی اینکه آیا کاربری وجود دارد یا نه
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.user.count().then(c => { console.log(c); return db.\$disconnect(); }).catch(() => { console.log(0); });
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
    echo "🌱 Database is empty, running seed..."
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const db = new PrismaClient();
        async function main() {
            console.log('Creating admin user...');
            await db.user.create({
                data: {
                    email: 'admin@monafaseh.ir',
                    passwordHash: '\$2b\$10\$rQZ8K9bN3pVxY1wH6mD2eO5qJ7sL4uF8tA0cB5nG3iH9jK6mP1qS',
                    fullName: 'مدیر سیستم',
                    role: 'admin',
                    age: 30,
                    gender: 'male',
                    province: 'تهران',
                    city: 'تهران',
                    phone: '0210000000',
                    recitationType: 'ترتیل',
                    reciterNationality: 'iranian',
                    favoriteReciter: 'عبدالباسط',
                }
            }).then(() => console.log('✓ Admin user created')).catch(() => console.log('⚠️ Admin already exists'));
        }
        main().finally(() => db.\$disconnect());
    " 2>/dev/null || true

    # Seed ads
    echo "🌱 Seeding ads..."
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const db = new PrismaClient();
        async function main() {
            await db.ad.deleteMany({});
            const ads = [
                { title: 'اپلیکیشن قرآن حافظ', description: 'حفظ قرآن با تکنیک علمی — ۱۴ روز رایگان', cta: 'دانلود اپ', url: 'https://qha.ir', theme: 'yellow', badge: 'تخفیف ۵۰٪', size: 'leaderboard', active: true, priority: 9 },
                { title: 'کتابفروشی نور', description: 'ترجمه‌ی قرآن، تفاسیر، و کتب حدیث — ارسال رایگان', cta: 'مشاهده فروشگاه', url: 'https://noorbooks.ir', theme: 'coral', badge: 'ارسال رایگان', size: 'leaderboard', active: true, priority: 8 },
                { title: 'دوره‌ی تجوید آنلاین', description: 'آموزش تجوید با اساتید بنام — ثبت‌نام زمستانه', cta: 'ثبت‌نام', url: 'https://tajweed.online', theme: 'sky', badge: 'جدید', size: 'rectangle', active: true, priority: 7 },
                { title: 'تلاوت‌های MP3 قاریان بزرگ', description: 'آرشیو کامل تلاوت‌های عبدالباسط، الحصری، المنشاوی', cta: 'شنیدن رایگان', url: 'https://everyayah.com', theme: 'green', badge: 'رایگان', size: 'rectangle', active: true, priority: 8 },
                { title: 'بازار محجبه', description: 'پوشاک اسلامی باکیفیت — تنوع ۵۰۰+ مدل', cta: 'خرید', url: 'https://mahjube.ir', theme: 'coral', badge: 'تخفیف ویژه', size: 'rectangle', active: true, priority: 6 },
                { title: 'تقویم رمضان ۱۴۴۶', description: 'ابراز زمان‌سنجی افطار و سحر برای ۱۰۰ شهر ایران', cta: 'دریافت تقویم', url: 'https://ramadan.ir', theme: 'yellow', badge: 'جدید', size: 'leaderboard', active: true, priority: 5 },
                { title: 'پادکست «روایت نور»', description: 'هر هفته داستان‌هایی از قرآن و سیره‌ی اهل‌بیت', cta: 'شنیدن پادکست', url: 'https://revayat-noor.ir', theme: 'navy', badge: 'هر شنبه', size: 'rectangle', active: true, priority: 6 },
                { title: 'سفر حلال — تورهای عمره', description: 'بسته‌های عمره و زیارت با صفر بهره', cta: 'رزرو تور', url: 'https://safarhalal.ir', theme: 'green', badge: 'تور پاییزه', size: 'billboard', active: true, priority: 7 },
                { title: 'آکادمی حفاظ نور', description: 'حفظ کامل قرآن در ۳ سال — پذیرش سال جدید', cta: 'ثبت‌نام آزمون', url: 'https://huffaz-noor.ir', theme: 'rainbow', badge: 'آزمون ورودی', size: 'billboard', active: true, priority: 8 },
                { title: 'قرض‌الحسنه نور', description: 'وام‌های قرض‌الحسنه بدون کارمزد — تا ۵۰ میلیون', cta: 'درخواست وام', url: 'https://qarz-hasane-noor.ir', theme: 'sky', badge: 'بدون کارمزد', size: 'rectangle', active: true, priority: 5 },
                { title: 'اپلیکیشن اوقات شرعی', description: 'اذان‌گو، قبله‌نما، و تقویم اسلامی — برای همه شهرها', cta: 'نصب رایگان', url: 'https://owghat.app', theme: 'green', badge: 'رایگان', size: 'leaderboard', active: true, priority: 7 },
                { title: 'آموزش عربی قرآنی', description: 'ترجمه و درک مطلب قرآن در ۶ ماه — ضمانت بازگشت وجه', cta: 'شروع رایگان', url: 'https://arabi-quran.ir', theme: 'coral', badge: '۶ ماه', size: 'rectangle', active: true, priority: 6 },
            ];
            for (const ad of ads) {
                await db.ad.create({ data: ad });
            }
            console.log('✓ Seeded ' + ads.length + ' ads');
        }
        main().catch(console.error).finally(() => db.\$disconnect());
    " 2>/dev/null || true

    # Seed ad slots
    echo "🌱 Seeding ad slots..."
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const db = new PrismaClient();
        async function main() {
            await db.adSlot.deleteMany({});
            const slots = [
                { id: 'landing-top', page: 'landing', pageLabel: 'صفحه اصلی', position: 'بالای صفحه — بین هرو و آمار', size: 'leaderboard', width: 728, height: 90, enabled: true },
                { id: 'landing-mid-1', page: 'landing', pageLabel: 'صفحه اصلی', position: 'وسط ۱ — بین آمار و دسترسی سریع', size: 'rectangle', width: 300, height: 250, enabled: true },
                { id: 'landing-mid-2', page: 'landing', pageLabel: 'صفحه اصلی', position: 'وسط ۲ — بین دسترسی سریع و آیه قرآن', size: 'inline', width: 1000, height: 100, enabled: true },
                { id: 'landing-bottom', page: 'landing', pageLabel: 'صفحه اصلی', position: 'پایین صفحه — بنر بزرگ', size: 'billboard', width: 970, height: 250, enabled: true },
                { id: 'sessions-top', page: 'sessions', pageLabel: 'محافل زنده', position: 'بالای لیست محافل', size: 'leaderboard', width: 728, height: 90, enabled: true },
                { id: 'sessions-mid', page: 'sessions', pageLabel: 'محافل زنده', position: 'بین لیست محافل و کاربران آنلاین', size: 'rectangle', width: 300, height: 250, enabled: true },
                { id: 'challenge-top', page: 'challenge', pageLabel: 'چالش رقابت', position: 'بالای صفحه', size: 'leaderboard', width: 728, height: 90, enabled: true },
                { id: 'challenge-mid', page: 'challenge', pageLabel: 'چالش رقابت', position: 'بین «چطور کار می‌کند» و کاربران آنلاین', size: 'rectangle', width: 300, height: 250, enabled: true },
                { id: 'create-session-side', page: 'create-session', pageLabel: 'تشکیل محفل', position: 'ستون کناری — زیر کاربران آنلاین', size: 'rectangle', width: 300, height: 250, enabled: true },
                { id: 'blog-top', page: 'blog', pageLabel: 'بلاگ', position: 'بالای لیست پست‌ها', size: 'leaderboard', width: 728, height: 90, enabled: true },
                { id: 'blog-mid', page: 'blog', pageLabel: 'بلاگ', position: 'پایین لیست پست‌ها', size: 'rectangle', width: 300, height: 250, enabled: true },
                { id: 'dashboard-bottom', page: 'dashboard', pageLabel: 'داشبورد', position: 'پایین داشبورد', size: 'rectangle', width: 300, height: 250, enabled: true },
            ];
            for (const slot of slots) {
                await db.adSlot.create({ data: slot });
            }
            console.log('✓ Seeded ' + slots.length + ' slots');
        }
        main().catch(console.error).finally(() => db.\$disconnect());
    " 2>/dev/null || true
else
    echo "✓ Database already has users, skipping seed"
fi

# ─── ۳. استارت سرور ──────────────────────────────────────────
echo "🌐 Starting Next.js server..."
exec node server.js
