import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/lounges/[id]/messages — پیام‌های تالار
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const lounge = await db.lounge.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } },
        members: { where: { isOnline: true }, select: { id: true } },
      },
    });
    if (!lounge) {
      return NextResponse.json({ ok: false, error: "تالار پیدا نشد" }, { status: 404 });
    }
    // جداسازی جنسیتی تالارها (طبق قوانین منافسه)
    if (
      lounge.genderRestriction !== "all" &&
      user &&
      user.gender &&
      lounge.genderRestriction !== user.gender
    ) {
      return NextResponse.json(
        { ok: false, error: "این تالار ویژه " + (lounge.genderRestriction === "male" ? "آقایان" : "بانوان") + " است" },
        { status: 403 },
      );
    }

    let pinned: { id: string; text: string; senderName: string } | null = null;
    if (lounge.pinnedMessageId) {
      const pm = await db.loungeMessage.findUnique({
        where: { id: lounge.pinnedMessageId },
        include: { user: { select: { fullName: true } } },
      });
      if (pm) {
        pinned = {
          id: pm.id,
          text: pm.text,
          senderName: pm.user?.fullName ?? "",
        };
      }
    }

    const messages = await db.loungeMessage.findMany({
      where: { loungeId: id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarColor: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 50, // Last 50 messages
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      senderId: m.user.id,
      senderName: m.user.fullName,
      senderAvatarColor: m.user.avatarColor,
      senderAvatarUrl: m.user.avatarUrl,
      text: m.text,
      timestamp: m.createdAt.getTime(),
      type: m.type,
      voiceDuration: m.voiceDuration,
      imageUrl: m.imageUrl,
      inviteSessionId: m.inviteSessionId,
      inviteSessionTitle: m.inviteSessionTitle,
    }));

    return NextResponse.json({
      ok: true,
      messages: formatted,
      pinned,
      genderRestriction: lounge.genderRestriction,
      loungeInfo: {
        id: lounge.id,
        name: lounge.name,
        description: lounge.description,
        category: lounge.category,
        color: lounge.color,
        memberCount: lounge._count.members,
        onlineCount: lounge.members.length,
        isPrivate: lounge.isPrivate,
        genderRestriction: lounge.genderRestriction,
        creatorId: lounge.creatorId,
      },
    });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت پیام‌ها" },
      { status: 500 },
    );
  }
}

// POST /api/lounges/[id]/messages — ارسال پیام
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

    const body = await request.json();
    const { text, type, voiceDuration, imageUrl, inviteSessionId, inviteSessionTitle } = body;

    if (!text && type === "text") {
      return NextResponse.json(
        { ok: false, error: "متن پیام الزامی است" },
        { status: 400 },
      );
    }

    // جداسازی جنسیتی
    const loungeForGender = await db.lounge.findUnique({ where: { id } });
    if (
      loungeForGender &&
      loungeForGender.genderRestriction !== "all" &&
      user.gender &&
      loungeForGender.genderRestriction !== user.gender
    ) {
      return NextResponse.json(
        { ok: false, error: "این تالار ویژه " + (loungeForGender.genderRestriction === "male" ? "آقایان" : "بانوان") + " است" },
        { status: 403 },
      );
    }

    // Check if user is a member
    const membership = await db.loungeMember.findUnique({
      where: {
        loungeId_userId: {
          loungeId: id,
          userId: user.id,
        },
      },
    });

    if (membership && membership.role === "muted") {
      return NextResponse.json(
        { ok: false, error: "شما در این تالار سکوت شده‌اید" },
        { status: 403 },
      );
    }

    if (!membership) {
      // Auto-join if not a member
      await db.loungeMember.create({
        data: {
          loungeId: id,
          userId: user.id,
          role: "member",
          isOnline: true,
        },
      });
    }

    const message = await db.loungeMessage.create({
      data: {
        loungeId: id,
        userId: user.id,
        text: text || "",
        type: type || "text",
        voiceDuration: voiceDuration || null,
        imageUrl: imageUrl || null,
        inviteSessionId: inviteSessionId || null,
        inviteSessionTitle: inviteSessionTitle || null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarColor: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: {
        id: message.id,
        senderId: message.user.id,
        senderName: message.user.fullName,
        senderAvatarColor: message.user.avatarColor,
        senderAvatarUrl: message.user.avatarUrl,
        text: message.text,
        timestamp: message.createdAt.getTime(),
        type: message.type,
        voiceDuration: message.voiceDuration,
        imageUrl: message.imageUrl,
        inviteSessionId: message.inviteSessionId,
        inviteSessionTitle: message.inviteSessionTitle,
      },
    });
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در ارسال پیام" },
      { status: 500 },
    );
  }
}
