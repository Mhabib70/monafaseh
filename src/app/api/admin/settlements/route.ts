import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/admin/settlements — لیست همه درخواست‌های تسویه (ادمین)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const settlements = await db.settlement.findMany({
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const stats = {
    pending: settlements.filter((s) => s.status === "pending").length,
    totalAmount: settlements
      .filter((s) => s.status !== "rejected")
      .reduce((sum, s) => sum + s.amount, 0),
  };

  return NextResponse.json({
    ok: true,
    stats,
    settlements: settlements.map((s) => ({
      id: s.id,
      amount: s.amount,
      status: s.status,
      iban: s.iban,
      accountHolder: s.accountHolder,
      bankName: s.bankName,
      createdAt: s.createdAt.getTime(),
      user: s.user,
    })),
  });
}

// PATCH /api/admin/settlements — تغییر وضعیت تسویه
// body: { id, status: "approved"|"paid"|"rejected" }
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const body = await request.json();
  const { id, status } = body;
  if (!id || !["approved", "paid", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ ok: false, error: "پارامترها نامعتبر است" }, { status: 400 });
  }

  const settlement = await db.settlement.update({
    where: { id },
    data: { status, processedBy: admin.id },
  });

  return NextResponse.json({ ok: true, settlement: { id: settlement.id, status: settlement.status } });
}
