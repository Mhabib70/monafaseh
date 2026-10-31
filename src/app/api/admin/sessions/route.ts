import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/get-current-user";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });

  try {
    const sessions = await db.recitationSession.findMany({
      include: {
        host: { select: { id: true, fullName: true, avatarColor: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      sessions: sessions.map((s) => ({
        id: s.id, title: s.title, hostName: s.host.fullName,
        hostAvatarColor: s.host.avatarColor, recitationType: s.recitationType,
        surah: s.surah, capacity: s.capacity, attendees: s._count.participants,
        status: s.status, passwordProtected: s.passwordProtected,
        startedAt: s.startedAt.getTime(), createdAt: s.createdAt.getTime(),
      })),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "خطا" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });

  try {
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ ok: false, error: "شناسه الزامی" }, { status: 400 });

    await db.recitationSession.delete({ where: { id: sessionId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "خطا در حذف" }, { status: 500 });
  }
}
