import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// ============================================================
// POST /api/lounges/[id]/moderate — ابزار مدیریت تالار
// action: deleteMessage | pin | unpin | mute | unmute
// مجاز: سازنده تالار، ادمین تالار، یا ادمین کل سایت
// ============================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
    }

    const body = await request.json();
    const action = String(body?.action ?? "");
    const messageId = body?.messageId ? String(body.messageId) : null;
    const targetUserId = body?.userId ? String(body.userId) : null;

    const lounge = await db.lounge.findUnique({ where: { id } });
    if (!lounge) {
      return NextResponse.json({ ok: false, error: "تالار پیدا نشد" }, { status: 404 });
    }

    // بررسی مجوز
    const membership = await db.loungeMember.findUnique({
      where: { loungeId_userId: { loungeId: id, userId: user.id } },
    });
    const isSiteAdmin = user.role === "admin";
    const isCreator = lounge.creatorId === user.id;
    const isLoungeAdmin = membership?.role === "admin";
    if (!isSiteAdmin && !isCreator && !isLoungeAdmin) {
      return NextResponse.json(
        { ok: false, error: "فقط مدیر تالار به این ابزار دسترسی دارد" },
        { status: 403 },
      );
    }

    switch (action) {
      case "deleteMessage": {
        if (!messageId) {
          return NextResponse.json({ ok: false, error: "messageId الزامی است" }, { status: 400 });
        }
        // اگر پیام سنجاق‌شده بود، سنجاق هم برداشته شود
        await db.$transaction([
          db.loungeMessage.delete({ where: { id: messageId } }),
          ...(lounge.pinnedMessageId === messageId
            ? [db.lounge.update({ where: { id }, data: { pinnedMessageId: null } })]
            : []),
        ]);
        return NextResponse.json({ ok: true });
      }

      case "pin": {
        if (!messageId) {
          return NextResponse.json({ ok: false, error: "messageId الزامی است" }, { status: 400 });
        }
        const msg = await db.loungeMessage.findUnique({ where: { id: messageId } });
        if (!msg || msg.loungeId !== id) {
          return NextResponse.json({ ok: false, error: "پیام یافت نشد" }, { status: 404 });
        }
        await db.lounge.update({ where: { id }, data: { pinnedMessageId: messageId } });
        return NextResponse.json({ ok: true });
      }

      case "unpin": {
        await db.lounge.update({ where: { id }, data: { pinnedMessageId: null } });
        return NextResponse.json({ ok: true });
      }

      case "mute": {
        if (!targetUserId) {
          return NextResponse.json({ ok: false, error: "userId الزامی است" }, { status: 400 });
        }
        if (targetUserId === user.id) {
          return NextResponse.json({ ok: false, error: "نمی‌توانید خودتان را سکوت کنید" }, { status: 400 });
        }
        await db.loungeMember.update({
          where: { loungeId_userId: { loungeId: id, userId: targetUserId } },
          data: { role: "muted" },
        });
        return NextResponse.json({ ok: true });
      }

      case "listMuted": {
        const muted = await db.loungeMember.findMany({
          where: { loungeId: id, role: "muted" },
          select: { userId: true, user: { select: { fullName: true } } },
        });
        return NextResponse.json({
          ok: true,
          muted: muted.map((m) => ({ userId: m.userId, fullName: m.user.fullName })),
        });
      }

      case "unmute": {
        if (!targetUserId) {
          return NextResponse.json({ ok: false, error: "userId الزامی است" }, { status: 400 });
        }
        await db.loungeMember.update({
          where: { loungeId_userId: { loungeId: id, userId: targetUserId } },
          data: { role: "member" },
        });
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ ok: false, error: "عملیات نامعتبر است" }, { status: 400 });
    }
  } catch (error) {
    console.error("Lounge moderate error:", error);
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}
