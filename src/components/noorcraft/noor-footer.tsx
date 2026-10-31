"use client";

import { NoorLogo } from "./noor-logo";
import { Heart } from "lucide-react";

// آیدی سازنده در همه پلتفرم‌ها
const CREATOR_ID = "mhabib70";

// لینک‌های رسمی پلتفرم‌های ایرانی با لوگوی واقعی
const SOCIAL_LINKS = [
  {
    label: "بله",
    href: `https://ble.ir/${CREATOR_ID}`,
    icon: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/images/social/bale.png" alt="بله" className="h-6 w-6" />
    ),
  },
  {
    label: "ایتا",
    href: `https://eitaa.com/${CREATOR_ID}`,
    icon: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/images/social/eitaa.png" alt="ایتا" className="h-6 w-6" />
    ),
  },
  {
    label: "روبیکا",
    href: `https://rubika.ir/${CREATOR_ID}`,
    icon: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/images/social/rubika.jpg" alt="روبیکا" className="h-6 w-6 rounded-lg" />
    ),
  },
];

export function NoorFooter() {
  return (
    <footer className="mt-auto border-t border-noor-navy/10 bg-white/[0.02] backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <NoorLogo size={40} withText />
            <p className="max-w-xs text-center text-xs text-muted-foreground md:text-right">
              منافسه — پلتفرمی آنلاین برای گردهمایی قاریان قرآن و رقابتی دوستانه.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={`${social.label} — @${CREATOR_ID}`}
                  className="grid h-10 w-10 place-items-center rounded-full bg-noor-sky/20 transition hover:scale-110 hover:bg-noor-sky/40"
                >
                  {social.icon}
                </a>
              ))}
            </div>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              ساخته‌شده با
              <Heart className="h-3 w-3 fill-noor-coral text-noor-coral" />
              برای دوست‌داران قرآن کریم
            </p>
            <p className="text-[10px] text-muted-foreground">
              ساخته شده توسط محمد حبیب‌زاده فرد
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
