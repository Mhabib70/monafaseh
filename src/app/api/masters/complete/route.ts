import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// POST /api/masters/complete — تکمیل جلسه خصوصی + ثبت درآمد قاری
// فقط میزبان (استاد) یا ادمین می‌تواند جلسه را تکمیل کند.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
  }

  const body = await request.json();
  const bookingId = body?.bookingId;
  if (!bookingId) {
    return NextResponse.json({ ok: false, error: "bookingId الزامی است" }, { status: 400 });
  }

  const booking = await db.masterBooking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return NextResponse.json({ ok: false, error: "رزرو پیدا نشد" }, { status: 404 });
  }
  if (booking.status !== "active") {
    return NextResponse.json({ ok: false, error: "این رزرو قبلاً نهایی شده است" }, { status: 400 });
  }

  const isMaster = booking.masterId === user.id;
  const isAdmin = user.role === "admin";
  if (!isMaster && !isAdmin) {
    return NextResponse.json({ ok: false, error: "فقط استاد جلسه می‌تواند آن را تکمیل کند" }, { status: 403 });
  }

  await db.$transaction(async (tx) => {
    await tx.masterBooking.update({
      where: { id: booking.id },
      data: { status: "completed" },
    });

    // درآمد استاد (تومان) — ثبت به‌صورت تراکنش earning
    const previous = await tx.creditTransaction.findMany({
      where: { userId: booking.masterId, type: "earning" },
      select: { amount: true },
    });
    const tomanBalance =
      previous.reduce((sum, t) => sum + t.amount, 0) + booking.masterEarning;

    await tx.creditTransaction.create({
      data: {
        userId: booking.masterId,
        type: "earning",
        amount: booking.masterEarning,
        balanceAfter: tomanBalance,
        description: `درآمد جلسه خصوصی (${booking.creditsSpent} امتیاز)`,
        bookingId: booking.id,
      },
    });
  });

  return NextResponse.json({
    ok: true,
    masterEarning: booking.masterEarning,
  });
}
