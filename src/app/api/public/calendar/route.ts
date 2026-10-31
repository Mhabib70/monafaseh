import { NextRequest, NextResponse } from "next/server";
import { buildJalaaliYear, toJalaali, CALENDAR_SOURCE, HIJRI_RANGE } from "@/lib/noorcraft/calendar";

/**
 * GET /api/public/calendar?year=1405
 *
 * تقویم کامل یک سال شمسی: هر روز با تاریخ شمسی، قمری، روز هفته و تاریخ میلادی.
 * منبع: تقویم رسمی کشور (مرکز تقویم مؤسسه ژئوفیزیک دانشگاه تهران).
 * بدون احراز هویت؛ کش ۲۴ ساعت.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = Number(searchParams.get("year") || 0);

    const now = new Date();
    const current = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const year = Number.isFinite(raw) && raw > 0 ? Math.trunc(raw) : current.jy;

    if (year < 1390 || year > 1420) {
      return NextResponse.json(
        { ok: false, error: "سال باید بین ۱۳۹۰ و ۱۴۲۰ باشد" },
        { status: 400 },
      );
    }

    const months = buildJalaaliYear(year);
    const truncated = months.flatMap((m) => m.days).filter((d) => d.hijri.approx).length;

    return NextResponse.json(
      {
        ok: true,
        year,
        source: CALENDAR_SOURCE,
        hijriDataRange: HIJRI_RANGE,
        hijriApproxDays: truncated,
        months,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (error) {
    console.error("Public calendar error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در ساخت تقویم" },
      { status: 500 },
    );
  }
}
