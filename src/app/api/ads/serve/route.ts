import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/ads/serve?slot=landing-top
// بازگشت تبلیغ فعال برای یک جایگاه خاص. نیازی به لاگین ندارد.
//
// الگوریتم:
//   ۱. بررسی AdSlot — اگر وجود ندارد یا enabled=false → null
//   ۲. اگر assignedAdId دارد → آن تبلیغ را برمی‌گرداند (اگر active باشد)
//   ۳. در غیر این صورت → انتخاب خودکار از بین تبلیغات فعال مطابق با slot
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slot = searchParams.get("slot");
    if (!slot) {
      return NextResponse.json({ ok: false, ad: null });
    }

    // ۱. Check if slot exists and is enabled
    const slotRecord = await db.adSlot.findUnique({
      where: { id: slot },
    });

    if (!slotRecord || !slotRecord.enabled) {
      // Slot disabled or doesn't exist — show nothing
      return NextResponse.json({ ok: true, ad: null });
    }

    // ۲. If a specific ad is assigned, return it (if active)
    if (slotRecord.assignedAdId) {
      const assigned = await db.ad.findUnique({
        where: { id: slotRecord.assignedAdId },
      });
      if (assigned && assigned.active) {
        // Check time window
        const now = new Date();
        if (assigned.startAt && assigned.startAt > now) {
          // Not yet started
          return NextResponse.json({ ok: true, ad: null });
        }
        if (assigned.endAt && assigned.endAt < now) {
          // Expired
          return NextResponse.json({ ok: true, ad: null });
        }

        // Increment impressions (fire-and-forget)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        db.$transaction([
          db.ad.update({
            where: { id: assigned.id },
            data: { impressions: { increment: 1 } },
          }),
          db.adDailyStat.upsert({
            where: { adId_date: { adId: assigned.id, date: today } },
            create: { adId: assigned.id, date: today, impressions: 1, clicks: 0 },
            update: { impressions: { increment: 1 } },
          }),
        ]).catch(() => {});

        return NextResponse.json({ ok: true, ad: assigned });
      }
    }

    // ۳. Auto-select: pick from active ads matching this slot
    const now = new Date();
    const candidates = await db.ad.findMany({
      where: { active: true },
    });

    // Filter by time window
    const valid = candidates.filter((ad) => {
      if (ad.startAt && ad.startAt > now) return false;
      if (ad.endAt && ad.endAt < now) return false;
      return true;
    });

    if (valid.length === 0) {
      return NextResponse.json({ ok: true, ad: null });
    }

    // Filter by slot match
    const slotMatched = valid.filter(
      (ad) => !ad.slot || ad.slot === slot,
    );

    if (slotMatched.length === 0) {
      return NextResponse.json({ ok: true, ad: null });
    }

    // Weighted random selection by priority
    const weighted: typeof slotMatched = [];
    for (const ad of slotMatched) {
      for (let i = 0; i < ad.priority; i++) {
        weighted.push(ad);
      }
    }

    const dayBucket = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    const seed = hashString(`${slot}-${dayBucket}`);
    const chosen = weighted[seed % weighted.length];

    // Increment impressions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    db.$transaction([
      db.ad.update({
        where: { id: chosen.id },
        data: { impressions: { increment: 1 } },
      }),
      db.adDailyStat.upsert({
        where: { adId_date: { adId: chosen.id, date: today } },
        create: { adId: chosen.id, date: today, impressions: 1, clicks: 0 },
        update: { impressions: { increment: 1 } },
      }),
    ]).catch(() => {});

    return NextResponse.json({ ok: true, ad: chosen });
  } catch (error) {
    console.error("Ad serve error:", error);
    return NextResponse.json({ ok: false, ad: null });
  }
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
