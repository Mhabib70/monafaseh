import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";
import { CREDIT_VALUE_TOMAN, PLATFORM_FEE_PERCENT } from "@/lib/payment/saman";
import { priceCapForRank } from "@/lib/noorcraft/constants";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

// ============================================================
// POST /api/masters/book — رزرو جلسه خصوصی با استاد
// کسر امتیاز بر اساس قیمت تعیین‌شده استاد (۱ تا ۵۰ امتیاز)
// ============================================================

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
  }

  const body = await request.json();
  const masterId = body?.masterId;
  if (!masterId) {
    return NextResponse.json({ ok: false, error: "masterId الزامی است" }, { status: 400 });
  }
  if (masterId === user.id) {
    return NextResponse.json(
      { ok: false, error: "نمی‌توانید جلسه با خودتان رزرو کنید" },
      { status: 400 },
    );
  }

  // استاد باید تأییدشده و آنلاین و فعال باشد
  const master = await db.user.findUnique({ where: { id: masterId } });
  if (!master || master.verificationStatus !== "approved") {
    return NextResponse.json(
      { ok: false, error: "این قاری تأیید نشده است" },
      { status: 400 },
    );
  }
  if (!master.isOfferingPrivateSessions) {
    return NextResponse.json(
      { ok: false, error: "این قاری در حال حاضر جلسه خصوصی نمی‌گذارد" },
      { status: 400 },
    );
  }
  if (Date.now() - master.lastVisit.getTime() > ONLINE_WINDOW_MS) {
    return NextResponse.json(
      { ok: false, error: "این قاری آنلاین نیست — فقط قاریان آنلاین قابل رزرو هستند" },
      { status: 400 },
    );
  }

  // کسر امتیاز بر اساس قیمت تعیین‌شده استاد (۱ تا ۵۰)
  const bookingCredits = Math.min(priceCapForRank(master.qariRank), Math.max(1, master.privateSessionPrice ?? 1));

  const student = await db.user.findUnique({ where: { id: user.id } });
  if (!student || student.creditBalance < bookingCredits) {
    return NextResponse.json(
      {
        ok: false,
        error: `امتیاز کافی ندارید — این قاری برای هر جلسه ${bookingCredits} امتیاز لازم دارد؛ موجودی شما ${student?.creditBalance ?? 0} امتیاز است`,
        neededCredits: bookingCredits,
        balance: student?.creditBalance ?? 0,
      },
      { status: 400 },
    );
  }

  const booking = await db.$transaction(async (tx) => {
    const balanceAfter = student.creditBalance - bookingCredits;
    await tx.user.update({
      where: { id: student.id },
      data: { creditBalance: balanceAfter },
    });
    await tx.creditTransaction.create({
      data: {
        userId: student.id,
        type: "spend",
        amount: bookingCredits,
        balanceAfter,
        description: `رزرو جلسه خصوصی با ${master.fullName}`,
      },
    });

    // ایجاد محفل خصوصی
    const session = await tx.recitationSession.create({
      data: {
        title: `جلسه خصوصی با ${master.fullName}`,
        description: `جلسه خصوصی رزرو‌شده توسط ${student.fullName}`,
        hostId: master.id,
        recitationType: master.recitationType ?? "ترتیل",
        reciterNationality: master.reciterNationality ?? "iranian",
        favoriteReciter: master.favoriteReciter ?? "عبدالباسط",
        surah: "—",
        capacity: 2,
        status: "private",
        genderRestriction: "all",
        jitsiRoom: `monafaseh-private-${Date.now().toString(36)}`,
      },
    });

    const creditsValue = bookingCredits * CREDIT_VALUE_TOMAN;
    return tx.masterBooking.create({
      data: {
        masterId: master.id,
        studentId: student.id,
        sessionId: session.id,
        creditsSpent: bookingCredits,
        creditsValue,
        platformFee: Math.round((creditsValue * PLATFORM_FEE_PERCENT) / 100),
        masterEarning: creditsValue - Math.round((creditsValue * PLATFORM_FEE_PERCENT) / 100),
        status: "active",
      },
      include: { session: true },
    });
  });

  return NextResponse.json({
    ok: true,
    booking: {
      id: booking.id,
      sessionId: booking.sessionId,
      sessionTitle: booking.session?.title,
      jitsiRoom: booking.session?.jitsiRoom,
    },
  });
}
