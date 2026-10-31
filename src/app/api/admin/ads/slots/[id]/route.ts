import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// PATCH /api/admin/ads/slots/[id] — به‌روزرسانی جایگاه (enabled / assignedAdId)
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
    const { enabled, assignedAdId } = body;

    // Check existence
    const existing = await db.adSlot.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "جایگاه پیدا نشد" },
        { status: 404 },
      );
    }

    const data: any = {};
    if (typeof enabled === "boolean") data.enabled = enabled;
    if (assignedAdId === null) {
      data.assignedAdId = null;
    } else if (typeof assignedAdId === "string") {
      // Verify the ad exists
      const ad = await db.ad.findUnique({ where: { id: assignedAdId } });
      if (!ad) {
        return NextResponse.json(
          { ok: false, error: "تبلیغ انتخاب‌شده پیدا نشد" },
          { status: 404 },
        );
      }
      data.assignedAdId = assignedAdId;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { ok: false, error: "هیچ فیلدی برای به‌روزرسانی ارسال نشد" },
        { status: 400 },
      );
    }

    const slot = await db.adSlot.update({
      where: { id },
      data,
      include: {
        ad: {
          select: { id: true, title: true, active: true, imageUrl: true, theme: true },
        },
      },
    });

    return NextResponse.json({ ok: true, slot });
  } catch (error) {
    console.error("Slot update error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در به‌روزرسانی جایگاه" },
      { status: 500 },
    );
  }
}
