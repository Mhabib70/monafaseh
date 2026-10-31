import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/admin/verify — لیست درخواست‌های احراز + آمار (ادمین)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const requests = await db.verificationRequest.findMany({
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          city: true,
          province: true,
          recitationType: true,
          noorPoints: true,
          avatarColor: true,
          avatarUrl: true,
          verificationStatus: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: await db.user.count({ where: { verificationStatus: "approved" } }),
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return NextResponse.json({
    ok: true,
    stats,
    requests: requests.map((r) => ({
      id: r.id,
      requestType: r.requestType,
      fullName: r.fullName,
      bio: r.bio,
      recitationVideoUrl: r.recitationVideoUrl,
      socialLinks: r.socialLinks,
      achievements: r.achievements,
      competitionId: r.competitionId,
      competitionYear: r.competitionYear,
      status: r.status,
      adminNote: r.adminNote,
      reviewedAt: r.reviewedAt?.getTime() ?? null,
      createdAt: r.createdAt.getTime(),
      user: r.user,
    })),
  });
}
