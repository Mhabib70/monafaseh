import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/admin/ads/slots — لیست همه‌ی جایگاه‌ها با تبلیغ اختصاص‌یافته
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "دسترسی فقط برای ادمین" },
        { status: 403 },
      );
    }

    const slots = await db.adSlot.findMany({
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            active: true,
            imageUrl: true,
            theme: true,
          },
        },
      },
      orderBy: [{ page: "asc" }, { id: "asc" }],
    });

    // Get all active ads for the assignment dropdown
    const allAds = await db.ad.findMany({
      where: { active: true },
      select: { id: true, title: true, theme: true },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({ ok: true, slots, allAds });
  } catch (error) {
    console.error("Slots fetch error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت جایگاه‌ها" },
      { status: 500 },
    );
  }
}
