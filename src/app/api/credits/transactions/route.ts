import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/credits/transactions — تاریخچه تراکنش‌های امتیاز
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
  }

  const transactions = await db.creditTransaction.findMany({
    where: { userId: user.id, type: { not: "earning" } }, // earning تومانی است، در تاریخچه امتیاز نمی‌آید
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    ok: true,
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      description: t.description,
      createdAt: t.createdAt.getTime(),
    })),
  });
}
