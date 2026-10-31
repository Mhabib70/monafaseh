import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/get-current-user";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });

  try {
    const lounges = await db.lounge.findMany({
      include: { _count: { select: { members: true, messages: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      lounges: lounges.map((l) => ({
        id: l.id, name: l.name, description: l.description, category: l.category,
        color: l.color, memberCount: l._count.members, messageCount: l._count.messages,
        isPrivate: l.isPrivate, createdAt: l.createdAt.getTime(),
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
    const loungeId = new URL(request.url).searchParams.get("loungeId");
    if (!loungeId) return NextResponse.json({ ok: false, error: "شناسه الزامی" }, { status: 400 });

    await db.lounge.delete({ where: { id: loungeId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "خطا در حذف" }, { status: 500 });
  }
}
