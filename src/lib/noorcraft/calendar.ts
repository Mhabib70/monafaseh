// تقویم شمسی و قمری — نسخه سایت
// منبع داده: تقویم رسمی کشور (مرکز تقویم مؤسسه ژئوفیزیک دانشگاه تهران)
// داده‌ها در calendar.json نگهداری می‌شود؛ برای سال جدید فقط همان فایل به‌روز می‌شود.
import raw from "./calendar.json";
import occasionsRaw from "./occasions.json";

type HijriStart = { hy: number; hm: number; name: string; date: string };

const DATA = raw as unknown as {
  source: string;
  note: string;
  hijriMonthStarts: HijriStart[];
};

export const OFFICIAL_OCCASIONS = (occasionsRaw as unknown as {
  source: string;
  byDate: Record<string, string>;
}).byDate;

export const OCCASIONS_SOURCE = (occasionsRaw as unknown as { source: string }).source;

export const CALENDAR_SOURCE = DATA.source;
export const HIJRI_DATA_NOTE = DATA.note;

const DAY = 86400000;

const STARTS = DATA.hijriMonthStarts
  .map((m) => ({ ...m, ts: Date.parse(`${m.date}T00:00:00Z`) }))
  .sort((a, b) => a.ts - b.ts);

export const HIJRI_RANGE = {
  from: STARTS[0].date,
  to: new Date(STARTS[STARTS.length - 1].ts + 29 * DAY).toISOString().slice(0, 10),
};

// ---------- شمسی (الگوریتم بورکوفسکی) ----------
const div = (a: number, b: number) => Math.trunc(a / b);
const mod = (a: number, b: number) => a - Math.trunc(a / b) * b;

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function jalCal(jy: number) {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
    2192, 2262, 2324, 2394, 2456, 3178,
  ];
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jump = 0;
  for (let i = 1; i < breaks.length; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

export function toJalaali(gy: number, gm: number, gd: number) {
  const jdn = g2d(gy, gm, gd);
  const gy2 = d2g(jdn).gy;
  let jy = gy2 - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy2, 3, r.march);
  let k = jdn - jdn1f;
  let jm: number;
  let jd: number;
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

export function toGregorian(jy: number, jm: number, jd: number) {
  return d2g(j2d(jy, jm, jd));
}

export function isJalaaliLeap(jy: number) {
  return jalCal(jy).leap === 0;
}

export function jalaaliMonthLength(jy: number, jm: number) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaaliLeap(jy) ? 30 : 29;
}

// ---------- قمری ----------
function tabularHijri(gy: number, gm: number, gd: number) {
  const jd = g2d(gy, gm, gd);
  let l = jd - 1948440 + 10632;
  const n = div(l - 1, 10631);
  l = l - 10631 * n + 354;
  const j =
    div(10985 - l, 5316) * div(50 * l, 17719) +
    div(l, 5670) * div(43 * l, 15238);
  l = l - div(30 - j, 15) * div(17719 * j, 50) - div(j, 16) * div(15238 * j, 43) + 29;
  const m = div(24 * l, 709);
  const d = l - div(709 * m, 24);
  const y = 30 * n + j - 30;
  return { hy: y, hm: m, hd: d };
}

export type HijriDate = { hy: number; hm: number; hd: number; approx: boolean };

export function gregorianToHijri(gy: number, gm: number, gd: number): HijriDate {
  const ts = Date.UTC(gy, gm - 1, gd);
  let lo = 0;
  let hi = STARTS.length - 1;
  let idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (STARTS[mid].ts <= ts) {
      idx = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (idx >= 0) {
    const s = STARTS[idx];
    const hd = Math.round((ts - s.ts) / DAY) + 1;
    if (hd >= 1 && hd <= 30) return { hy: s.hy, hm: s.hm, hd, approx: false };
  }
  return { ...tabularHijri(gy, gm, gd), approx: true };
}

export function hijriMonthLength(hy: number, hm: number): number | null {
  const i = STARTS.findIndex((m) => m.hy === hy && m.hm === hm);
  if (i >= 0 && STARTS[i + 1]) {
    return Math.round((STARTS[i + 1].ts - STARTS[i].ts) / DAY);
  }
  return null;
}

// ---------- ثابت‌ها و قالب‌بندی ----------
export const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

export const HIJRI_MONTHS = [
  "محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی", "جمادی‌الاول",
  "جمادی‌الثانی", "رجب", "شعبان", "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه",
];

export const WEEKDAYS = [
  "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه",
];

export const faDigits = (s: string | number) =>
  String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

export function dayInfo(gy: number, gm: number, gd: number) {
  const j = toJalaali(gy, gm, gd);
  const h = gregorianToHijri(gy, gm, gd);
  const weekday = WEEKDAYS[new Date(Date.UTC(gy, gm - 1, gd)).getUTCDay()];
  const iso = `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
  return {
    gregorian: { gy, gm, gd, iso },
    jalaali: { ...j, monthName: JALALI_MONTHS[j.jm - 1] },
    hijri: { ...h, monthName: HIJRI_MONTHS[Math.max(0, Math.min(11, h.hm - 1))] },
    weekday,
    occasion: OFFICIAL_OCCASIONS[iso] ?? null,
  };
}

export type CalendarDay = {
  jalaali: { jy: number; jm: number; jd: number; monthName: string };
  hijri: HijriDate & { monthName: string };
  gregorian: { gy: number; gm: number; gd: number; iso: string };
  weekday: string;
  occasion: string | null;
};

export function buildJalaaliYear(jy: number) {
  const months: { month: number; name: string; length: number; days: CalendarDay[] }[] = [];
  for (let jm = 1; jm <= 12; jm += 1) {
    const len = jalaaliMonthLength(jy, jm);
    const days: CalendarDay[] = [];
    for (let jd = 1; jd <= len; jd += 1) {
      const g = toGregorian(jy, jm, jd);
      days.push(dayInfo(g.gy, g.gm, g.gd));
    }
    months.push({ month: jm, name: JALALI_MONTHS[jm - 1], length: len, days });
  }
  return months;
}
