import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/reports/feed?since=<epoch-ms>&secret=<REPORT_SECRET>
 *
 * خوراک رویدادهای سایت برای ربات گزارش‌های کانال خصوصی.
 * فقط از سرور/لوکال قابل استفاده است و به کلید محافظت‌شده نیاز دارد.
 */
export const dynamic = "force-dynamic";

const LIMIT = 50;

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const secret = process.env.REPORT_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "report secret not configured" }, { status: 503 });
  }

  const provided =
    request.headers.get("x-report-key") ||
    new URL(request.url).searchParams.get("secret");
  if (provided !== secret) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const sinceRaw = Number(searchParams.get("since") || 0);
    const since = Number.isFinite(sinceRaw) && sinceRaw > 0 ? new Date(sinceRaw) : new Date(Date.now() - 60 * 60 * 1000);

    // until را قبل از کوئری‌ها ثابت نگه می‌داریم تا رویدادی بین کوئری‌ها گم نشود
    const until = new Date();

    const [users, verifications, bookings, payments, settlements, sessions, posts, credits] =
      await Promise.all([
        db.user.findMany({
          where: { createdAt: { gt: since, lte: until } },
          select: { id: true, fullName: true, email: true, phone: true, city: true, province: true, role: true, createdAt: true },
          orderBy: { createdAt: "asc" },
          take: LIMIT,
        }),
        db.verificationRequest.findMany({
          where: { createdAt: { gt: since, lte: until } },
          select: { id: true, fullName: true, requestType: true, status: true, createdAt: true },
          orderBy: { createdAt: "asc" },
          take: LIMIT,
        }),
        db.masterBooking.findMany({
          where: { createdAt: { gt: since, lte: until } },
          select: {
            id: true,
            creditsSpent: true,
            creditsValue: true,
            status: true,
            createdAt: true,
            master: { select: { fullName: true } },
            student: { select: { fullName: true } },
          },
          orderBy: { createdAt: "asc" },
          take: LIMIT,
        }),
        db.payment.findMany({
          where: { createdAt: { gt: since, lte: until } },
          select: {
            id: true,
            amount: true,
            credits: true,
            plan: true,
            status: true,
            samanRefNum: true,
            createdAt: true,
            user: { select: { fullName: true } },
          },
          orderBy: { createdAt: "asc" },
          take: LIMIT,
        }),
        db.settlement.findMany({
          where: { createdAt: { gt: since, lte: until } },
          select: { id: true, amount: true, status: true, createdAt: true, user: { select: { fullName: true } } },
          orderBy: { createdAt: "asc" },
          take: LIMIT,
        }),
        db.recitationSession.findMany({
          where: { createdAt: { gt: since, lte: until } },
          select: { id: true, title: true, createdAt: true, host: { select: { fullName: true } } },
          orderBy: { createdAt: "asc" },
          take: LIMIT,
        }),
        db.blogPost.findMany({
          where: { createdAt: { gt: since, lte: until } },
          select: { id: true, title: true, createdAt: true },
          orderBy: { createdAt: "asc" },
          take: LIMIT,
        }),
        db.creditTransaction.findMany({
          where: { createdAt: { gt: since, lte: until } },
          select: { id: true, type: true, amount: true, description: true, createdAt: true, user: { select: { fullName: true } } },
          orderBy: { createdAt: "asc" },
          take: LIMIT,
        }),
      ]);

    return NextResponse.json(
      {
        ok: true,
        since: since.getTime(),
        until: until.getTime(),
        users,
        verifications,
        bookings,
        payments,
        settlements,
        sessions,
        posts,
        credits,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Reports feed error:", error);
    return NextResponse.json({ ok: false, error: "خطا در خواندن رویدادها" }, { status: 500 });
  }
}
