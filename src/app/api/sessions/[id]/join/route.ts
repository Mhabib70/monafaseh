import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// POST /api/sessions/[id]/join — پیوستن به محفل
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "ابتدا وارد شوید" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const providedPassword = body?.password as string | undefined;

    // Auto-cleanup: اگر محفلی بیش از ۶۰ دقیقه است باز است، آن را پایان می‌دهیم
    // تا کاربر نتواند به محافل رهاشده قدیمی بپیوندد.
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
          data: { status: "ended", endedAt: new Date() },
        });
        await db.sessionParticipant.deleteMany({
          where: { sessionId: { in: stale.map((s) => s.id) } },
        });
      }
    } catch (cleanupErr) {
      console.error("Join auto-cleanup error:", cleanupErr);
    }

    const session = await db.recitationSession.findUnique({
      where: { id },
      include: {
        participants: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "محفل پیدا نشد" },
        { status: 404 },
      );
    }

    // Don't allow joining ended sessions
    if (session.status === "ended") {
      return NextResponse.json(
        { ok: false, error: "این محفل پایان یافته است" },
        { status: 403 },
      );
    }

    // Check gender restriction — BLOCK opposite gender
    if (session.genderRestriction !== "all") {
      if (user.gender && session.genderRestriction !== user.gender) {
        const msg =
          session.genderRestriction === "male"
            ? "این محفل فقط برای آقایان است. امکان پیوستن وجود ندارد."
            : "این محفل فقط برای بانوان است. امکان پیوستن وجود ندارد.";

        return NextResponse.json(
          { ok: false, error: msg },
          { status: 403 },
        );
      }
    }

    // Check password for private sessions
    if (session.passwordProtected) {
      if (!providedPassword || providedPassword !== session.password) {
        return NextResponse.json(
          { ok: false, error: "رمز محفل اشتباه است" },
          { status: 403 },
        );
      }
    }

    // Check if already joined
    const existing = session.participants.find(
      (p) => p.userId === user.id,
    );

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyJoined: true,
        jitsiRoom: session.jitsiRoom,
        genderRestriction: session.genderRestriction,
      });
    }

    // Check capacity
    if (session.participants.length >= session.capacity) {
      return NextResponse.json(
        { ok: false, error: "ظرفیت محفل تکمیل است" },
        { status: 403 },
      );
    }

    // Add participant
    await db.sessionParticipant.create({
      data: {
        sessionId: session.id,
        userId: user.id,
      },
    });

    return NextResponse.json({
      ok: true,
      jitsiRoom: session.jitsiRoom,
      genderRestriction: session.genderRestriction,
    });
  } catch (error) {
    console.error("Join session error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در پیوستن به محفل" },
      { status: 500 },
    );
  }
}
