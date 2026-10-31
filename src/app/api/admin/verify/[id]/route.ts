import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// PATCH /api/admin/verify/[id] — تصمیم داور روی آزمون احراز
// body: { status: "approved"|"rejected", qariRank?: "bronze"|"silver"|"gold", adminNote?: string }
// سطح را داور تعیین می‌کند، نه کاربر.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const status = body?.status;
  const adminNote = body?.adminNote ? String(body.adminNote) : null;
  const qariRank = String(body?.qariRank ?? "");

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ ok: false, error: "وضعیت نامعتبر است" }, { status: 400 });
  }
  if (status === "approved" && !["bronze", "silver", "gold"].includes(qariRank)) {
    return NextResponse.json(
      { ok: false, error: "برای تأیید، سطح قاری (برنزی/نقره‌ای/طلایی) را انتخاب کنید" },
      { status: 400 },
    );
  }

  const req = await db.verificationRequest.findUnique({ where: { id } });
  if (!req) {
    return NextResponse.json({ ok: false, error: "درخواست پیدا نشد" }, { status: 404 });
  }

  // قاری ممکن است مدرک آپلود نکرده باشد — ادمین بر اساس شناخت خودش تأیید می‌کند
  const withoutCert = !req.auditionUrl && !req.recitationVideoUrl;
  const finalNote =
    adminNote ||
    (withoutCert && status === "approved" ? "تأیید بر اساس شناخت ادمین از قاری" : null);

  await db.$transaction(async (tx) => {
    await tx.verificationRequest.update({
      where: { id },
      data: {
        status,
        adminNote: finalNote,
        requestType: status === "approved" ? qariRank : req.requestType,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: req.userId },
      data:
        status === "approved"
          ? {
              verificationStatus: "approved",
              qariRank,
              verifiedAt: new Date(),
              verificationNote: finalNote,
            }
          : {
              verificationStatus: "rejected",
              verificationNote: adminNote,
            },
    });
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/verify/[id] — برداشتن تیک آبی از کاربر
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { id } = await params;
  const req = await db.verificationRequest.findUnique({ where: { id } });
  if (!req) {
    return NextResponse.json({ ok: false, error: "درخواست پیدا نشد" }, { status: 404 });
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: req.userId },
      data: {
        verificationStatus: "none",
        verifiedAt: null,
        qariRank: null,
        verificationNote: "تیک آبی توسط ادمین برداشته شد",
        isOfferingPrivateSessions: false,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
