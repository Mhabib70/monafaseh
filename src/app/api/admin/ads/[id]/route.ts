import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// PUT /api/admin/ads/[id] — ویرایش تبلیغ
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "دسترسی فقط برای ادمین" },
        { status: 403 },
      );
    }

    const { id } = await params;
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

    // Check existence
    const existing = await db.ad.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "تبلیغ پیدا نشد" },
        { status: 404 },
      );
    }

    const ad = await db.ad.update({
      where: { id },
      data: {
        title,
        description,
        cta,
        url,
        imageUrl: imageUrl ?? null,
        theme,
        badge: badge ?? null,
        size,
        slot: slot ?? null,
        active,
        priority,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
      },
    });

    return NextResponse.json({ ok: true, ad });
  } catch (error) {
    console.error("Ad update error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در ویرایش تبلیغ" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/ads/[id] — حذف تبلیغ
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "دسترسی فقط برای ادمین" },
        { status: 403 },
      );
    }

    const { id } = await params;

    // Check existence
    const existing = await db.ad.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "تبلیغ پیدا نشد" },
        { status: 404 },
      );
    }

    await db.ad.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Ad delete error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در حذف تبلیغ" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/ads/[id] — toggle active (quick action)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "دسترسی فقط برای ادمین" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { active, priority } = body;

    const data: any = {};
    if (typeof active === "boolean") data.active = active;
    if (typeof priority === "number") data.priority = Math.max(1, Math.min(10, priority));

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { ok: false, error: "هیچ فیلدی برای به‌روزرسانی ارسال نشد" },
        { status: 400 },
      );
    }

    const ad = await db.ad.update({ where: { id }, data });
    return NextResponse.json({ ok: true, ad });
  } catch (error) {
    console.error("Ad patch error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در به‌روزرسانی" },
      { status: 500 },
    );
  }
}
