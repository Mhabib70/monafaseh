import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/lounges — لیست تالارها
export async function GET(request: NextRequest) {
  try {
    // Auto-cleanup: تالارهایی که بیش از ۱ ساعت از آخرین پیام آن‌ها گذشته
    // و هیچ پیامی ندارند، به‌صورت خودکار غیرفعال می‌شوند
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS);
    try {
      // Find all active lounges with their last message time
      const allActive = await db.lounge.findMany({
        where: { isActive: true },
        select: {
          id: true,
          createdAt: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      });

      const toDeactivate = allActive.filter((l) => {
        const lastMessageTime = l.messages.length > 0 ? l.messages[0].createdAt : l.createdAt;
        return lastMessageTime < oneHourAgo;
      });

      if (toDeactivate.length > 0) {
        await db.lounge.updateMany({
          where: { id: { in: toDeactivate.map((l) => l.id) } },
          data: { isActive: false },
        });
      }
    } catch (cleanupErr) {
      console.error("Lounge auto-cleanup error:", cleanupErr);
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";

    const where: any = { isActive: true };
    if (category !== "all") where.category = category;

    const lounges = await db.lounge.findMany({
      where,
      include: {
        _count: {
          select: { members: true, messages: true },
        },
        members: {
          where: { isOnline: true },
          select: { id: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { text: true, type: true, createdAt: true, userId: true, user: { select: { fullName: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // مرتب‌سازی بر اساس فعالیت: تالارهای دارای پیام اخیر اول (سبک تلگرام)
    lounges.sort((a, b) => {
      const ta = a.messages[0]?.createdAt?.getTime() ?? a.createdAt.getTime();
      const tb = b.messages[0]?.createdAt?.getTime() ?? b.createdAt.getTime();
      return tb - ta;
    });

    const formatted = lounges.map((l) => ({
      id: l.id,
      name: l.name,
      description: l.description,
      category: l.category,
      icon: l.icon,
      color: l.color,
      memberCount: l._count.members,
      onlineCount: l.members.length,
      tags: l.tags ? JSON.parse(l.tags) : [],
      isPrivate: l.isPrivate,
      genderRestriction: l.genderRestriction,
      relatedReciter: l.relatedReciter,
      relatedMaqam: l.relatedMaqam,
      relatedCity: l.relatedCity,
      creatorId: l.creatorId,
      createdAt: l.createdAt.getTime(),
      lastMessage: l.messages[0]
        ? {
            text: l.messages[0].type === "voice" ? "🎤 پیام صوتی" : l.messages[0].text,
            senderName: l.messages[0].user?.fullName ?? "",
            senderId: l.messages[0].userId,
            at: l.messages[0].createdAt.getTime(),
          }
        : null,
    }));

    return NextResponse.json({ ok: true, lounges: formatted });
  } catch (error) {
    console.error("Lounges fetch error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت تالارها" },
      { status: 500 },
    );
  }
}

// POST /api/lounges — ایجاد تالار جدید
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
      name,
      description,
      category,
      color,
      tags,
      isPrivate,
      relatedReciter,
      relatedMaqam,
      relatedCity,
    } = body;

    if (!name || !description || !category) {
      return NextResponse.json(
        { ok: false, error: "نام، توضیحات و دسته‌بندی الزامی هستند" },
        { status: 400 },
      );
    }

    const genderRaw = typeof body.genderRestriction === "string" ? body.genderRestriction : "all";
    const genderRestriction = ["male", "female", "all"].includes(genderRaw) ? genderRaw : "all";

    const lounge = await db.lounge.create({
      data: {
        name,
        description,
        category,
        genderRestriction,
        color: color || "#FFD700",
        tags: tags ? JSON.stringify(tags) : null,
        isPrivate: isPrivate || false,
        relatedReciter: relatedReciter || null,
        relatedMaqam: relatedMaqam || null,
        relatedCity: relatedCity || null,
        creatorId: user.id,
      },
    });

    // Add creator as admin member
    await db.loungeMember.create({
      data: {
        loungeId: lounge.id,
        userId: user.id,
        role: "admin",
        isOnline: true,
      },
    });

    return NextResponse.json({
      ok: true,
      loungeId: lounge.id,
    });
  } catch (error) {
    console.error("Lounge create error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در ایجاد تالار" },
      { status: 500 },
    );
  }
}
