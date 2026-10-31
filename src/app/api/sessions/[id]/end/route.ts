import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// POST /api/sessions/[id]/end — پایان دادن محفل (فقط میزبان)
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

    const session = await db.recitationSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "محفل پیدا نشد" },
        { status: 404 },
      );
    }

    // Only the host can end the session
    if (session.hostId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "فقط میزبان محفل می‌تواند آن را پایان دهد" },
        { status: 403 },
      );
    }

    await db.recitationSession.update({
      where: { id },
      data: {
        status: "ended",
        endedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("End session error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در پایان دادن محفل" },
      { status: 500 },
    );
  }
}
