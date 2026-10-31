import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";
import { validateIBAN, validateCardNumber } from "@/lib/payment/saman";

// GET /api/bank-info — اطلاعات بانکی + آمار درآمد کاربر
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
  }

  const fresh = await db.user.findUnique({
    where: { id: user.id },
    select: {
      iban: true,
      cardNumber: true,
      accountNumber: true,
      accountHolder: true,
      bankName: true,
      isOfferingPrivateSessions: true,
      privateSessionPrice: true,
      verificationStatus: true,
    },
  });

  // آمار درآمد (تومان) — earning‌ها منهای تسویه‌های پرداخت‌شده/تأییدشده
  const earnings = await db.creditTransaction.findMany({
    where: { userId: user.id, type: "earning" },
    select: { amount: true },
  });
  const totalEarning = earnings.reduce((s, t) => s + t.amount, 0);

  const settled = await db.settlement.aggregate({
    where: { userId: user.id, status: { in: ["approved", "paid"] } },
    _sum: { amount: true },
  });

  return NextResponse.json({
    ok: true,
    bankInfo: {
      iban: fresh?.iban ?? "",
      cardNumber: fresh?.cardNumber ?? "",
      accountNumber: fresh?.accountNumber ?? "",
      accountHolder: fresh?.accountHolder ?? "",
      bankName: fresh?.bankName ?? "",
      isOfferingPrivateSessions: fresh?.isOfferingPrivateSessions ?? false,
      privateSessionPrice: fresh?.privateSessionPrice ?? 1,
    },
    stats: {
      totalEarning,
      withdrawn: settled._sum.amount ?? 0,
      available: totalEarning - (settled._sum.amount ?? 0),
      isVerified: fresh?.verificationStatus === "approved",
    },
  });
}

// POST /api/bank-info — ذخیره اطلاعات بانکی قاری
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
  }

  const body = await request.json();
  const iban = String(body?.iban ?? "").trim().toUpperCase();
  const cardNumber = String(body?.cardNumber ?? "").trim();
  const accountNumber = String(body?.accountNumber ?? "").trim();
  const accountHolder = String(body?.accountHolder ?? "").trim();
  const bankName = String(body?.bankName ?? "").trim();
  const isOfferingPrivateSessions = !!body?.isOfferingPrivateSessions;

  // اطلاعات بانکی الزامی
  if (!validateIBAN(iban)) {
    return NextResponse.json(
      { ok: false, error: "شماره شبا نامعتبر است — باید به‌صورت IR + ۲۴ رقم باشد" },
      { status: 400 },
    );
  }
  if (!validateCardNumber(cardNumber)) {
    return NextResponse.json(
      { ok: false, error: "شماره کارت نامعتبر است — باید ۱۶ رقم باشد" },
      { status: 400 },
    );
  }
  if (!accountHolder || !bankName) {
    return NextResponse.json(
      { ok: false, error: "نام صاحب حساب و نام بانک الزامی است" },
      { status: 400 },
    );
  }

  // فعالیت به‌عنوان استاد فقط برای قاریان تأییدشده
  const fresh = await db.user.findUnique({
    where: { id: user.id },
    select: { verificationStatus: true },
  });
  if (isOfferingPrivateSessions && fresh?.verificationStatus !== "approved") {
    return NextResponse.json(
      { ok: false, error: "برای گذاشتن جلسه خصوصی ابتدا تیک آبی دریافت کنید" },
      { status: 403 },
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      iban,
      cardNumber,
      accountNumber: accountNumber || null,
      accountHolder,
      bankName,
      isOfferingPrivateSessions,
    },
  });

  return NextResponse.json({ ok: true });
}
