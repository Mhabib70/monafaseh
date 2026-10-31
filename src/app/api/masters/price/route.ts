import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";
import { priceCapForRank, qariBadgeLabel } from "@/lib/noorcraft/constants";

// ============================================================
// POST /api/masters/price — تعیین قیمت هر جلسه خصوصی توسط استاد
// قیمت به «امتیاز» است (هر امتیاز ۵۰,۰۰۰ تومان ارزش خرید شاگرد
// دارد). سهم استاد ۸۵٪ هر جلسه است. فقط قاریان تأییدشده (تیک آبی)
// مجاز به تعیین قیمت هستند. بازه مجاز: ۱ تا ۵۰ امتیاز.
// ============================================================

const MIN_PRICE = 1;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.verificationStatus !== "approved") {
    return NextResponse.json(
      { ok: false, error: "فقط قاریان تأییدشده می‌توانند قیمت تعیین کنند" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const cap = priceCapForRank(dbUser.qariRank);
  const price = Math.floor(Number(body?.price));
  if (!Number.isFinite(price) || price < MIN_PRICE || price > cap) {
    return NextResponse.json(
      { ok: false, error: `قیمت باید بین ${MIN_PRICE} تا ${cap} امتیاز باشد — سقف رنک شما (${qariBadgeLabel(dbUser.qariRank)})` },
      { status: 400 },
    );
  }

  await db.user.update({
    where: { id: dbUser.id },
    data: { privateSessionPrice: price },
  });

  return NextResponse.json({ ok: true, price, cap });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
  }
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { privateSessionPrice: true, isOfferingPrivateSessions: true, qariRank: true },
  });
  return NextResponse.json({
    ok: true,
    price: dbUser?.privateSessionPrice ?? 1,
    cap: priceCapForRank(dbUser?.qariRank),
    rankLabel: qariBadgeLabel(dbUser?.qariRank),
    isOfferingPrivateSessions: dbUser?.isOfferingPrivateSessions ?? false,
  });
}
