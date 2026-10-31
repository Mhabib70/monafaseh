import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/public/weekly-report
 *
 * آمار واقعی یک هفته (شنبه تا جمعه، به وقت تهران) برای پیام «گزارش هفته» کانال ایتا.
 * بدون احراز هویت. پارامتر اختیاری: ?weeksAgo=1 (تا ۸ هفته قبل)
 */

const TEHRAN_OFFSET = 3.5 * 3600 * 1000;
const WEEK_MS = 7 * 24 * 3600 * 1000;

export const dynamic = "force-dynamic";

function weekRange(now: number, weeksAgo: number) {
  const t = new Date(now + TEHRAN_OFFSET);
  const day = t.getUTCDay(); // 0=یکشنبه … 6=شنبه
  const daysSinceSaturday = (day + 1) % 7;
  const startOfToday =
    Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - TEHRAN_OFFSET;
  const start = startOfToday - daysSinceSaturday * 86400000 - weeksAgo * WEEK_MS;
  return { start, end: start + WEEK_MS };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = Number(searchParams.get("weeksAgo") || 0);
    const weeksAgo = Number.isFinite(raw) ? Math.max(0, Math.min(8, Math.trunc(raw))) : 0;

    const { start, end } = weekRange(Date.now(), weeksAgo);
    const from = new Date(start);
    const to = new Date(end);

    const [sessions, competitions, privateBookings, newUsers, blogPosts, tahmeeds] =
      await Promise.all([
        db.recitationSession.count({ where: { createdAt: { gte: from, lt: to } } }),
        db.competition.count({ where: { createdAt: { gte: from, lt: to } } }),
        db.masterBooking.count({ where: { createdAt: { gte: from, lt: to } } }),
        db.user.count({ where: { createdAt: { gte: from, lt: to } } }),
        db.blogPost.count({ where: { createdAt: { gte: from, lt: to } } }),
        db.tahmeed.count({ where: { createdAt: { gte: from, lt: to } } }),
      ]);

    return NextResponse.json(
      {
        ok: true,
        generatedAt: Date.now(),
        weeksAgo,
        weekStart: start,
        weekEnd: end,
        counts: {
          sessions,
          competitions,
          privateBookings,
          newUsers,
          blogPosts,
          tahmeeds,
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Public weekly-report error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در محاسبه گزارش هفتگی" },
      { status: 500 },
    );
  }
}
