import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/sessions/[id]/participants — لیست شرکت‌کنندگان محفل
// این API برای sync کردن لیست participants بین میزبان و مهمان‌ها استفاده می‌شود
// تا همه در دور تلاوت قرار بگیرند — حتی قبل از اتصال WebRTC
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await db.recitationSession.findUnique({
      where: { id },
      select: { id: true, title: true, jitsiRoom: true },
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "محفل پیدا نشد" },
        { status: 404 },
      );
    }

    const participants = await db.sessionParticipant.findMany({
      where: { sessionId: id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarColor: true,
            avatarUrl: true,
            gender: true,
            recitationType: true,
          },
        },
      },
    });

    const formatted = participants.map((p, idx) => ({
      id: p.user.id,
      name: p.user.fullName,
      avatarColor: p.user.avatarColor,
      avatarUrl: p.user.avatarUrl,
      order: idx,
    }));

    return NextResponse.json({
      ok: true,
      participants: formatted,
      jitsiRoom: session.jitsiRoom,
    });
  } catch (error) {
    console.error("Participants fetch error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت شرکت‌کنندگان" },
      { status: 500 },
    );
  }
}
