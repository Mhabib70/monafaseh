import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// POST /api/lounges/[id]/end — پایان دادن تالار (فقط ایجادکننده)
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

    const lounge = await db.lounge.findUnique({
      where: { id },
      select: { id: true, creatorId: true, name: true },
    });

    if (!lounge) {
      return NextResponse.json(
        { ok: false, error: "تالار پیدا نشد" },
        { status: 404 },
      );
    }

    // Only the creator can end the lounge
    if (lounge.creatorId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "فقط ایجادکننده تالار می‌تواند آن را پایان دهد" },
        { status: 403 },
      );
    }

    await db.lounge.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Lounge end error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در پایان دادن تالار" },
      { status: 500 },
    );
  }
}
