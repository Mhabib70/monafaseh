import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/admin/ads — لیست همه‌ی تبلیغات
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "دسترسی فقط برای ادمین" },
        { status: 403 },
      );
    }

    const ads = await db.ad.findMany({
      orderBy: [{ active: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ ok: true, ads });
  } catch (error) {
    console.error("Ads fetch error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت تبلیغات" },
      { status: 500 },
    );
  }
}

// POST /api/admin/ads — ایجاد تبلیغ جدید
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "دسترسی فقط برای ادمین" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      cta,
      url,
      imageUrl,
      theme,
      badge,
      size,
      slot,
      active,
      priority,
      startAt,
      endAt,
    } = body;

    if (!title || !description || !cta || !url) {
      return NextResponse.json(
        { ok: false, error: "عنوان، توضیحات، متن دکمه و لینک الزامی هستند" },
        { status: 400 },
      );
    }

    const ad = await db.ad.create({
      data: {
        title,
        description,
        cta,
        url,
        imageUrl: imageUrl || null,
        theme: theme || "yellow",
        badge: badge || null,
        size: size || "leaderboard",
        slot: slot || null,
        active: active ?? true,
        priority: priority ?? 5,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
      },
    });

    return NextResponse.json({ ok: true, ad });
  } catch (error) {
    console.error("Ad create error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در ایجاد تبلیغ" },
      { status: 500 },
    );
  }
}
