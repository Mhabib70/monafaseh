import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActiveChallenges } from "@/lib/challenge-store";

/**
 * GET /api/public/live-rooms
 *
 * نقطه ورود عمومی و سبک برای ماژول پیام‌های رویدادمحور کانال ایتا.
 * بدون احراز هویت؛ فقط داده‌های قابل انتشار را برمی‌گرداند:
 *   - محافل زنده‌ی بدون رمز
 *   - چالش‌های باز (منتظر حریف)
 *   - استادان تأییدشده‌ای که آنلاین‌اند و جلسه خصوصی می‌پذیرند
 *
 * کش: ۶۰ ثانیه (تا پایش مکرر، فشار مضاعف به سرور نیاورد)
 */

const SITE_URL = "https://monafaseh.vodda.ir";

// پنجره «آنلاین بودن» — هم‌راستا با /api/masters
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = Date.now();
    const onlineSince = new Date(now - ONLINE_WINDOW_MS);

    const [sessions, masters] = await Promise.all([
      // محافل: فقط پایان‌نیافته و بدون رمز (محفل خصوصی قابل تبلیغ عمومی نیست)
      db.recitationSession.findMany({
        where: {
          status: { not: "ended" },
          passwordProtected: false,
        },
        select: {
          id: true,
          title: true,
          recitationType: true,
          surah: true,
          capacity: true,
          status: true,
          genderRestriction: true,
          startedAt: true,
          host: { select: { fullName: true } },
          participants: { select: { id: true } },
        },
        orderBy: { startedAt: "asc" },
        take: 10,
      }),

      // استادان: تأییدشده + پذیرش جلسه خصوصی + آنلاین در ۵ دقیقه اخیر
      db.user.findMany({
        where: {
          verificationStatus: "approved",
          isOfferingPrivateSessions: true,
          lastVisit: { gte: onlineSince },
        },
        select: {
          id: true,
          fullName: true,
          qariRank: true,
          recitationType: true,
          privateSessionPrice: true,
          lastVisit: true,
        },
        orderBy: { lastVisit: "desc" },
        take: 10,
      }),
    ]);

    const challenges = getActiveChallenges().filter((c) => c.status === "pending");

    const liveRooms = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      hostName: s.host.fullName,
      recitationType: s.recitationType,
      surah: s.surah,
      attendees: s.participants.length,
      capacity: s.capacity,
      status: s.status,
      genderRestriction: s.genderRestriction,
      startedAt: s.startedAt.getTime(),
      url: `${SITE_URL}/?view=sessions&session=${s.id}`,
    }));

    const openChallenges = challenges.map((c) => ({
      id: c.id,
      userName: c.fullName,
      recitationType: c.recitationType,
      createdAt: c.createdAt,
      // عمر چالش ۵ دقیقه است؛ ثانیه‌های باقی‌مانده برای تصمیم‌گیری ماژول
      expiresIn: Math.max(0, 5 * 60 * 1000 - (now - c.createdAt)),
      url: `${SITE_URL}/?view=challenge`,
    }));

    const onlineMasters = masters.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      qariRank: m.qariRank,
      recitationType: m.recitationType,
      privateSessionPrice: m.privateSessionPrice,
      lastVisit: m.lastVisit.getTime(),
      url: `${SITE_URL}/?view=masters`,
    }));

    return NextResponse.json(
      {
        ok: true,
        generatedAt: now,
        counts: {
          liveRooms: liveRooms.length,
          openChallenges: openChallenges.length,
          onlineMasters: onlineMasters.length,
        },
        liveRooms,
        openChallenges,
        onlineMasters,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("Public live-rooms error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت رویدادهای فعال" },
      { status: 500 },
    );
  }
}
