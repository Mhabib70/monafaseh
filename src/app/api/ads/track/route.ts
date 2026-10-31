import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/ads/track
// ثبت کلیک یا نمایش روی تبلیغ. body: { id, type: "click" | "impression" }
// نیازی به لاگین ندارد — anonymous tracking.
// علاوه بر increment کردن فیلد کلی روی Ad، یک رکورد در AdDailyStat هم
// upsert می‌شود تا نمودارهای روزانه و auto-optimization کار کنند.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type } = body;

    if (!id || !type) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const ad = await db.ad.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!ad) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    // Today's date at 00:00 local
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (type === "click") {
      await db.$transaction([
        db.ad.update({
          where: { id },
          data: { clicks: { increment: 1 } },
        }),
        db.adDailyStat.upsert({
          where: { adId_date: { adId: id, date: today } },
          create: { adId: id, date: today, impressions: 0, clicks: 1 },
          update: { clicks: { increment: 1 } },
        }),
      ]);
    } else if (type === "impression") {
      await db.$transaction([
        db.ad.update({
          where: { id },
          data: { impressions: { increment: 1 } },
        }),
        db.adDailyStat.upsert({
          where: { adId_date: { adId: id, date: today } },
          create: { adId: id, date: today, impressions: 1, clicks: 0 },
          update: { impressions: { increment: 1 } },
        }),
      ]);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Ad track error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
