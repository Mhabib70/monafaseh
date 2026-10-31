import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/admin/export?type=users|sessions|lounges — خروجی CSV
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const type = new URL(request.url).searchParams.get("type") || "users";

  if (type === "users") {
    const users = await db.user.findMany({
      select: {
        fullName: true, email: true, phone: true, role: true, gender: true,
        age: true, province: true, city: true, recitationType: true,
        favoriteReciter: true, noorPoints: true, sessionsAttended: true,
        profileCompletion: true, streak: true, createdAt: true, lastVisit: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "نام", "ایمیل", "تلفن", "نقش", "جنسیت", "سن", "استان", "شهر",
      "نوع تلاوت", "قاری اقتدا", "امتیاز نور", "جلسات", "تکمیل پروفایل",
      "استریک", "تاریخ عضویت", "آخرین بازدید",
    ];

    const rows = users.map((u) => [
      u.fullName, u.email, u.phone || "", u.role, u.gender || "",
      u.age || "", u.province || "", u.city || "",
      u.recitationType || "", u.favoriteReciter || "",
      u.noorPoints, u.sessionsAttended, u.profileCompletion, u.streak,
      u.createdAt.toISOString(), u.lastVisit.toISOString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");

    return new NextResponse("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="users-${Date.now()}.csv"`,
      },
    });
  }

  if (type === "sessions") {
    const sessions = await db.recitationSession.findMany({
      include: {
        host: { select: { fullName: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = ["عنوان", "میزبان", "نوع تلاوت", "سوره", "ظرفیت", "شرکت‌کنندگان", "وضعیت", "جنسیت", "تاریخ"];
    const rows = sessions.map((s) => [
      s.title, s.host.fullName, s.recitationType, s.surah,
      s.capacity, s._count.participants, s.status, s.genderRestriction,
      s.createdAt.toISOString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    return new NextResponse("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sessions-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ ok: false, error: "نوع نامعتبر" }, { status: 400 });
}
