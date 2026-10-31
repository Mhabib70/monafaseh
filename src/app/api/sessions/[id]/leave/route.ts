import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// POST /api/sessions/[id]/leave — خروج کاربر از محفل (بدون بستن محفل)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Auto-cleanup: اگر محفلی بیش از ۶۰ دقیقه است باز است، آن را پایان می‌دهیم.
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
      console.error("Leave auto-cleanup error:", cleanupErr);
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "ابتدا وارد شوید" },
        { status: 401 },
      );
    }

    const session = await db.recitationSession.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "محفل پیدا نشد" },
        { status: 404 },
      );
    }

    // Remove the participant record (if exists)
    const existing = session.participants.find((p) => p.userId === user.id);
    if (existing) {
      await db.sessionParticipant.delete({
        where: { id: existing.id },
      });
    }

    // If no participants left AND host left, auto-end the session
    const remaining = await db.sessionParticipant.count({
      where: { sessionId: session.id },
    });

    if (remaining === 0) {
      // Auto-end empty sessions
      await db.recitationSession.update({
        where: { id: session.id },
        data: {
          status: "ended",
          endedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ ok: true, remaining });
  } catch (error) {
    console.error("Leave session error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در خروج از محفل" },
      { status: 500 },
    );
  }
}
