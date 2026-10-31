import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";
import { MIN_SETTLEMENT_AMOUNT } from "@/lib/payment/saman";

// GET /api/settlement/request — لیست درخواست‌های تسویه کاربر
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
  }

  const settlements = await db.settlement.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    ok: true,
    settlements: settlements.map((s) => ({
      id: s.id,
      amount: s.amount,
      status: s.status,
      bankName: s.bankName,
      createdAt: s.createdAt.getTime(),
    })),
  });
}

// POST /api/settlement/request — درخواست تسویه جدید
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
  }

  const body = await request.json();
  const amount = parseInt(String(body?.amount ?? ""), 10);

  if (!amount || isNaN(amount)) {
    return NextResponse.json({ ok: false, error: "مبلغ نامعتبر است" }, { status: 400 });
  }
  if (amount < MIN_SETTLEMENT_AMOUNT) {
    return NextResponse.json(
      { ok: false, error: `حداقل مبلغ تسویه ${MIN_SETTLEMENT_AMOUNT.toLocaleString("fa-IR")} تومان است` },
      { status: 400 },
    );
  }

  const fresh = await db.user.findUnique({
    where: { id: user.id },
    select: { iban: true, accountHolder: true, bankName: true },
  });
  if (!fresh?.iban || !fresh?.accountHolder || !fresh?.bankName) {
    return NextResponse.json(
      { ok: false, error: "ابتدا اطلاعات بانکی خود را کامل کنید" },
      { status: 400 },
    );
  }

  // موجودی قابل تسویه = مجموع درآمد - تسویه‌های تأییدشده/پرداخت‌شده - درخواست‌های در انتظار
  const earnings = await db.creditTransaction.findMany({
    where: { userId: user.id, type: "earning" },
    select: { amount: true },
  });
  const totalEarning = earnings.reduce((s, t) => s + t.amount, 0);
  const reserved = await db.settlement.aggregate({
    where: { userId: user.id, status: { in: ["pending", "approved", "paid"] } },
    _sum: { amount: true },
  });
  const available = totalEarning - (reserved._sum.amount ?? 0);

  if (amount > available) {
    return NextResponse.json(
      { ok: false, error: `موجودی قابل تسویه شما ${available.toLocaleString("fa-IR")} تومان است` },
      { status: 400 },
    );
  }

  const settlement = await db.settlement.create({
    data: {
      userId: user.id,
      amount,
      status: "pending",
      iban: fresh.iban,
      accountHolder: fresh.accountHolder,
      bankName: fresh.bankName,
    },
  });

  return NextResponse.json({
    ok: true,
    settlement: { id: settlement.id, amount: settlement.amount, status: settlement.status },
  });
}
