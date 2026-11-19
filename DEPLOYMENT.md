# راهنمای استقرار و CI/CD منافسه

## اجرای محلی همراه ودا

از ریشهٔ پروژه:

```bash
./debug.sh up-d
```

منافسه روی `http://localhost:3423` در دسترس است. لاگ همهٔ سرویس‌ها با `./debug.sh logs` دیده می‌شود. پورت میزبان را می‌توان با `MONAFASEH_PORT` در `.env.local` تغییر داد.

## استقرار خودکار با GitHub Actions

مخزن دارای دو workflow در پوشه `.github/workflows/` است:

1. **CI (`ci.yml`)**: روی هر Pull Request و پوش به `main` اجرا می‌شود و `tsc --noEmit`، `npm run lint` و `npm run build` را بررسی می‌کند.
2. **Build & Deploy (`deploy.yml`)**: پس از مرج به `main` (یا اجرای دستی)، تصویر Docker را ساخته و روی `ghcr.io` منتشر می‌کند و در صورت تنظیم Secretهای سرور، از طریق SSH به‌طور خودکار دیپلوی انجام می‌دهد.

### Secretهای مورد نیاز در مخزن گیت‌هاب

در مسیر **Settings -> Secrets and variables -> Actions** مقادیر زیر را اضافه کنید:

- `SERVER_HOST`: آی‌پی یا دامنه سرور
- `SERVER_USER`: نام کاربری SSH (پیش‌فرض: `root`)
- `SERVER_SSH_KEY`: کلید خصوصی SSH برای اتصال به سرور
- `SERVER_PORT`: پورت SSH (اختیاری، پیش‌فرض: `22`)
- `DEPLOY_PATH`: مسیر پروژه یا فایل `.env.production` روی سرور (اختیاری، پیش‌فرض: `/opt/monafaseh`)

## استقرار دستی (Docker / Compose)

مقادیر `MONAFASEH_NEXTAUTH_URL` و `MONAFASEH_SITE_URL` را در `.env.production` روی دامنهٔ نهایی تنظیم کنید. پورت داخلی منافسه `3000` است و در استقرار استاندارد روی `127.0.0.1:3423` به reverse proxy (مانند Caddy یا Nginx) متصل می‌شود.

## نگه‌داری داده

SQLite و فایل‌های آپلودی در volumeهای `monafaseh_monafaseh-db` و `monafaseh_monafaseh-uploads` ذخیره می‌شوند و در به‌روزرسانی‌های خودکار یا دستی حفظ می‌گردند.
