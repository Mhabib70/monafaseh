import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// POST /api/admin/ads/optimize
// Auto-optimization: اولویت تبلیغات را بر اساس CTR ۷ روز اخیر تنظیم می‌کند.
// الگوریتم:
//   ۱. برای هر تبلیغ فعال، CTR ۷ روز اخیر را محاسبه می‌کنیم.
//   ۲. CTR را به ۴ بازه‌ی کوانتایل تقسیم می‌کنیم.
//   ۳. اولویت را تنظیم می‌کنیم:
//      - Top 25%: priority = 10
//      - 25-50%: priority = 8
//      - 50-75%: priority = 6
//      - Bottom 25%: priority = 4
//      - کمتر از ۱۰ impression: priority = 5 (داده‌ی کافی نیست — neutral)
//   ۴. اولویت جدید را در DB ذخیره می‌کنیم.
//   ۵. گزارش تغییرات را برمی‌گردانیم.
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "دسترسی فقط برای ادمین" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { dryRun = false, lookbackDays = 7 } = body;

    const now = new Date();
    const start = new Date();
    start.setDate(start.getDate() - lookbackDays);
    start.setHours(0, 0, 0, 0);

    // Fetch all active ads
    const activeAds = await db.ad.findMany({
      where: { active: true },
      select: { id: true, title: true, priority: true },
    });

    if (activeAds.length === 0) {
      return NextResponse.json({
        ok: true,
        changes: [],
        message: "تبلیغ فعالی وجود ندارد",
      });
    }

    // Fetch daily stats for these ads in the lookback window
    const dailyStats = await db.adDailyStat.findMany({
      where: {
        adId: { in: activeAds.map((a) => a.id) },
        date: { gte: start, lte: now },
      },
      select: {
        adId: true,
        impressions: true,
        clicks: true,
      },
    });

    // Aggregate per ad
    const aggMap = new Map<
      string,
      { impressions: number; clicks: number }
    >();
    for (const s of dailyStats) {
      const existing = aggMap.get(s.adId) || { impressions: 0, clicks: 0 };
      existing.impressions += s.impressions;
      existing.clicks += s.clicks;
      aggMap.set(s.adId, existing);
    }

    // Build ad + ctr list (with min impression threshold)
    const MIN_IMPRESSIONS = 10;
    const adCtrList = activeAds.map((ad) => {
      const agg = aggMap.get(ad.id) || { impressions: 0, clicks: 0 };
      const ctr =
        agg.impressions >= MIN_IMPRESSIONS && agg.impressions > 0
          ? (agg.clicks / agg.impressions) * 100
          : null;
      return {
        ...ad,
        impressions: agg.impressions,
        clicks: agg.clicks,
        ctr,
        oldPriority: ad.priority,
      };
    });

    // Sort by CTR descending (nulls go last)
    const sorted = [...adCtrList].sort((a, b) => {
      if (a.ctr === null) return 1;
      if (b.ctr === null) return -1;
      return b.ctr - a.ctr;
    });

    // Compute new priorities via quartiles (only for ads with enough data)
    const withCtr = sorted.filter((a) => a.ctr !== null);
    const withoutCtr = sorted.filter((a) => a.ctr === null);

    const n = withCtr.length;
    const q1 = Math.floor(n * 0.25);
    const q2 = Math.floor(n * 0.5);
    const q3 = Math.floor(n * 0.75);

    const changes: Array<{
      adId: string;
      title: string;
      impressions: number;
      clicks: number;
      ctr: number | null;
      oldPriority: number;
      newPriority: number;
      reason: string;
    }> = [];

    withCtr.forEach((ad, idx) => {
      let newPriority: number;
      let reason: string;
      if (idx < q1) {
        newPriority = 10;
        reason = "۲۵٪ برتر CTR";
      } else if (idx < q2) {
        newPriority = 8;
        reason = "۲۵-۵۰٪ CTR";
      } else if (idx < q3) {
        newPriority = 6;
        reason = "۵۰-۷۵٪ CTR";
      } else {
        newPriority = 4;
        reason = "۲۵٪ پایین CTR";
      }
      changes.push({
        adId: ad.id,
        title: ad.title,
        impressions: ad.impressions,
        clicks: ad.clicks,
        ctr: ad.ctr !== null ? parseFloat(ad.ctr.toFixed(2)) : null,
        oldPriority: ad.oldPriority,
        newPriority,
        reason,
      });
    });

    // Ads without enough data → neutral priority (5)
    withoutCtr.forEach((ad) => {
      changes.push({
        adId: ad.id,
        title: ad.title,
        impressions: ad.impressions,
        clicks: ad.clicks,
        ctr: null,
        oldPriority: ad.oldPriority,
        newPriority: 5,
        reason: "داده‌ی کافی نیست (<۱۰ نمایش)",
      });
    });

    // Apply changes unless dryRun
    if (!dryRun) {
      await Promise.all(
        changes.map((c) =>
          db.ad.update({
            where: { id: c.adId },
            data: { priority: c.newPriority },
          }),
        ),
      );
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      lookbackDays,
      changes,
      summary: {
        totalAds: changes.length,
        increased: changes.filter((c) => c.newPriority > c.oldPriority).length,
        decreased: changes.filter((c) => c.newPriority < c.oldPriority).length,
        unchanged: changes.filter((c) => c.newPriority === c.oldPriority).length,
      },
    });
  } catch (error) {
    console.error("Ad optimize error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در بهینه‌سازی" },
      { status: 500 },
    );
  }
}
