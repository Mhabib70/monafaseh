import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";
import { qariRankDef } from "@/lib/noorcraft/constants";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

// GET /api/masters — لیست قاریان تأییدشده (تیک آبی)
// آنلاین‌ها اول، سپس آفلاین. فقط کسانی که «جلسه خصوصی» فعال کرده‌اند قابل رزروند.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
  }

  const verified = await db.user.findMany({
    where: { verificationStatus: "approved" },
    select: {
      id: true,
      fullName: true,
      avatarColor: true,
      avatarUrl: true,
      gender: true,
      city: true,
      province: true,
      recitationType: true,
      reciterNationality: true,
      favoriteReciter: true,
      qariRank: true,
      verifiedAt: true,
      isOfferingPrivateSessions: true,
      privateSessionPrice: true,
      noorPoints: true,
      lastVisit: true,
    },
    orderBy: { noorPoints: "desc" },
  });

  const now = Date.now();
  const masters = verified.map((m) => {
    const online = now - m.lastVisit.getTime() < ONLINE_WINDOW_MS;
    return {
      id: m.id,
      fullName: m.fullName,
      avatarColor: m.avatarColor,
      avatarUrl: m.avatarUrl,
      gender: m.gender,
      city: m.city,
      province: m.province,
      recitationType: m.recitationType,
      reciterNationality: m.reciterNationality,
      favoriteReciter: m.favoriteReciter,
      qariRank: m.qariRank,
      verifiedAt: m.verifiedAt?.getTime() ?? null,
      isOfferingPrivateSessions: m.isOfferingPrivateSessions,
      privateSessionPrice: m.privateSessionPrice,
      noorPoints: m.noorPoints,
      online,
    };
  });

  // آنلاین‌ها و قابل‌رزروها اول
  masters.sort((a, b) => {
    const scoreA = (a.online ? 2 : 0) + (a.isOfferingPrivateSessions ? 1 : 0);
    const scoreB = (b.online ? 2 : 0) + (b.isOfferingPrivateSessions ? 1 : 0);
    if (scoreA !== scoreB) return scoreB - scoreA;
    // قاری رنک‌دار بالاتر فهرست: بین‌المللی > کشوری > استانی > عادی
    const rankA = qariRankDef(a.qariRank)?.order ?? 0;
    const rankB = qariRankDef(b.qariRank)?.order ?? 0;
    return rankB - rankA;
  });

  return NextResponse.json({ ok: true, masters });
}
