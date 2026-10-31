import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/admin/payments — گزارش پرداخت‌ها (ادمین)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const payments = await db.payment.findMany({
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const paid = payments.filter((p) => p.status === "paid");
  const stats = {
    totalPaid: paid.reduce((sum, p) => sum + p.amount, 0),
    totalCredits: paid.reduce((sum, p) => sum + p.credits, 0),
    count: paid.length,
    pending: payments.filter((p) => p.status === "pending").length,
  };

  return NextResponse.json({
    ok: true,
    stats,
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      credits: p.credits,
      plan: p.plan,
      status: p.status,
      samanResNum: p.samanResNum,
      samanRefNum: p.samanRefNum,
      createdAt: p.createdAt.getTime(),
      user: p.user,
    })),
  });
}
