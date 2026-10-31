import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/admin/users
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true, fullName: true, email: true, phone: true, role: true,
        province: true, city: true, recitationType: true, noorPoints: true,
        sessionsAttended: true, profileCompletion: true, avatarUrl: true,
        avatarColor: true, createdAt: true, lastVisit: true,
        _count: { select: { hostedSessions: true, loungeMemberships: true, loungeMessages: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      users: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.getTime(),
        lastVisit: u.lastVisit.getTime(),
      })),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "خطا در دریافت کاربران" }, { status: 500 });
  }
}

// PUT /api/admin/users
export async function PUT(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const { userId, action, points } = await request.json();
    let data: any = {};

    switch (action) {
      case "make-admin": data.role = "admin"; break;
      case "remove-admin": data.role = "user"; break;
      case "add-points": data.noorPoints = { increment: points || 10 }; break;
      case "remove-points": data.noorPoints = { decrement: points || 10 }; break;
      default: return NextResponse.json({ ok: false, error: "عملیات نامعتبر" }, { status: 400 });
    }

    await db.user.update({ where: { id: userId }, data });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "خطا در به‌روزرسانی" }, { status: 500 });
  }
}

// DELETE /api/admin/users
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ ok: false, error: "شناسه الزامی" }, { status: 400 });

    await db.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "خطا در حذف" }, { status: 500 });
  }
}
