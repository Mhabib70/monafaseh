import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/sessions — لیست محافل‌ها
export async function GET(request: NextRequest) {
  try {
    // قبل از هر چیز: به‌صورت خودکار محافلی که بیش از ۶۰ دقیقه از شروع آن‌ها گذشته
    // و هنوز پایان نیافته‌اند را «پایان» می‌کنیم. این کار برای جلوگیری از باز موندن
    // بی‌مورد محافل رهاشده انجام می‌شود (میزبان‌ها ممکن است فراموش کنند ببندند).
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS);
    try {
      const stale = await db.recitationSession.findMany({
        where: {
          status: { not: "ended" },
          startedAt: { lt: oneHourAgo },
        },
        select: { id: true },
      });
      if (stale.length > 0) {
        await db.recitationSession.updateMany({
          where: { id: { in: stale.map((s) => s.id) } },
          data: {
            status: "ended",
            endedAt: new Date(),
          },
        });
        // همچنین رکوردهای SessionParticipant را پاک می‌کنیم تا آمار حاضرین اشتباه نگردد
        await db.sessionParticipant.deleteMany({
          where: { sessionId: { in: stale.map((s) => s.id) } },
        });
      }
    } catch (cleanupErr) {
      // اگر cleanup خطا داد، لیست فعلی را همچنان برمی‌گردانیم
      console.error("Sessions auto-cleanup error:", cleanupErr);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const recitationType = searchParams.get("recitationType") || "all";

    const where: any = {
      // فقط محافل پایان‌نیافته را برگردان — محافل بسته‌شده در لیست نمایش داده نمی‌شوند
      status: { not: "ended" },
    };
    if (status !== "all") where.status = status;
    if (recitationType !== "all") where.recitationType = recitationType;

    const sessions = await db.recitationSession.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            avatarColor: true,
            avatarUrl: true,
            gender: true,
          },
        },
        participants: true,
      },
      orderBy: { startedAt: "desc" },
    });

    const formatted = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      hostId: s.hostId,
      hostName: s.host.fullName,
      hostAvatarColor: s.host.avatarColor,
      hostAvatarUrl: s.host.avatarUrl,
      hostGender: s.host.gender,
      recitationType: s.recitationType,
      reciterNationality: s.reciterNationality,
      favoriteReciter: s.favoriteReciter,
      surah: s.surah,
      capacity: s.capacity,
      attendees: s.participants.length,
      status: s.status,
      passwordProtected: s.passwordProtected,
      genderRestriction: s.genderRestriction,
      startedAt: s.startedAt.getTime(),
      jitsiRoom: s.jitsiRoom,
      description: s.description,
    }));

    return NextResponse.json({ ok: true, sessions: formatted });
  } catch (error) {
    console.error("Sessions fetch error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت محفل‌ها" },
      { status: 500 },
    );
  }
}

// POST /api/sessions — ایجاد محفل جدید
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "ابتدا وارد شوید" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      recitationType,
      reciterNationality,
      favoriteReciter,
      surah,
      capacity,
      isPrivate,
      password,
      genderRestriction,
    } = body;

    if (!title || !recitationType) {
      return NextResponse.json(
        { ok: false, error: "عنوان و نوع تلاوت الزامی هستند" },
        { status: 400 },
      );
    }

    // Force gender restriction based on host's gender — NO MIXED SESSIONS
    const effectiveGender = genderRestriction || user.gender || "male";
    if (effectiveGender !== "male" && effectiveGender !== "female") {
      return NextResponse.json(
        { ok: false, error: "محفل باید برای آقایان یا بانوان باشد" },
        { status: 400 },
      );
    }

    // Generate room name for WebRTC
    const jitsiRoom = `monafaseh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const newSession = await db.recitationSession.create({
      data: {
        title,
        description: description || null,
        hostId: user.id,
        recitationType,
        reciterNationality,
        favoriteReciter,
        surah,
        capacity: capacity || 10,
        status: isPrivate ? "private" : "open",
        passwordProtected: isPrivate || false,
        password: isPrivate ? password : null,
        genderRestriction: effectiveGender,
        jitsiRoom,
      },
    });

    // Add host as participant
    await db.sessionParticipant.create({
      data: {
        sessionId: newSession.id,
        userId: user.id,
      },
    });

    return NextResponse.json({
      ok: true,
      sessionId: newSession.id,
      jitsiRoom,
      genderRestriction: effectiveGender,
    });
  } catch (error) {
    console.error("Session create error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در ایجاد محفل" },
      { status: 500 },
    );
  }
}
