"use client";

import { NoorLogo } from "./noor-logo";
import { useNoorStore } from "@/store/noor-store";
import type { ViewName } from "@/lib/noorcraft/types";

const CREATOR_ID = "mhabib70";

const SOCIAL_LINKS = [
  {
    label: "بله",
    href: `https://ble.ir/${CREATOR_ID}`,
    icon: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/images/social/bale.png" alt="بله" className="h-5 w-5" />
    ),
  },
  {
    label: "ایتا",
    href: `https://eitaa.com/${CREATOR_ID}`,
    icon: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/images/social/eitaa.png" alt="ایتا" className="h-5 w-5" />
    ),
  },
  {
    label: "روبیکا",
    href: `https://rubika.ir/${CREATOR_ID}`,
    icon: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/images/social/rubika.jpg" alt="روبیکا" className="h-5 w-5 rounded" />
    ),
  },
];

const FOOTER_LINKS: { label: string; view: ViewName }[] = [
  { label: "محافل زنده", view: "sessions" },
  { label: "چالش رقابت", view: "challenge" },
  { label: "قاریان تأییدشده", view: "masters" },
  { label: "تالار گفتگو", view: "lounge" },
  { label: "یادداشت‌ها و بلاگ", view: "blog" },
];

export function NoorFooter() {
  const setView = useNoorStore((s) => s.setView);

  return (
    <footer className="mt-auto border-t border-border bg-card/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <NoorLogo size={38} withText />
            <p className="max-w-sm text-center text-xs leading-relaxed text-muted-foreground md:text-right">
              منافسه — بستری حرفه‌ای برای گردهمایی قاریان قرآن، مسابقات تلاوت، تحمید جمعی و جلسات خصوصی با استادان.
            </p>
          </div>

          <nav aria-label="لینک‌های فوتر" className="flex flex-wrap items-center justify-center gap-4">
            {FOOTER_LINKS.map((link) => (
              <button
                key={link.view}
                onClick={() => setView(link.view)}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex flex-col items-center gap-2.5 md:items-end">
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={`${social.label} — @${CREATOR_ID}`}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background transition-colors hover:border-primary/50 hover:bg-secondary"
                >
                  {social.icon}
                </a>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              طراحی و توسعه توسط محمد حبیب‌زاده فرد
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
