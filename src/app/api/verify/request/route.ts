import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";
import { TRUSTED_COMPETITIONS } from "@/lib/noorcraft/trusted-competitions";

// ============================================================
// POST /api/verify/request — ارسال «آزمون احراز قاری»
// سه چیز لازم است: نام کامل + تلاوت آزمونی (فایل/لینک) + پذیرش تعهد
// سطح (برنزی/نقره‌ای/طلایی) را داور تعیین می‌کند، نه کاربر.
// کاربر تأییدشده هم می‌تواند برای «ارتقا» دوباره آزمون بدهد.
// ============================================================

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
  }

  const body = await request.json();
  const fullName = String(body?.fullName ?? "").trim();
  const auditionUrl = String(body?.auditionUrl ?? "").trim();
  const skills = Array.isArray(body?.skills) ? body.skills.map(String).slice(0, 20) : [];
  const pledge = body?.pledge === true;
  const competitionId = String(body?.competitionId ?? "").trim();
  const competitionYear = String(body?.competitionYear ?? "").trim();

  // مسابقه باید از فهرست معتبر باشد
  const comp = TRUSTED_COMPETITIONS.find((c) => c.id === competitionId);
  if (!comp) {
    return NextResponse.json(
      { ok: false, error: "مسابقه انتخابی معتبر نیست — از فهرست مسابقات معتبر انتخاب کنید" },
      { status: 400 },
    );
  }
  if (!/^[0-9۰-۹]{4}$/.test(competitionYear)) {
    return NextResponse.json({ ok: false, error: "سال کسب مقام نامعتبر است" }, { status: 400 });
  }

  if (!fullName) {
    return NextResponse.json({ ok: false, error: "نام کامل الزامی است" }, { status: 400 });
  }
  if (!auditionUrl || auditionUrl.length > 500) {
    return NextResponse.json(
      { ok: false, error: "تلاوت آزمونی الزامی است — ضبط کنید، فایل بفرستید یا لینک بدهید" },
      { status: 400 },
    );
  }
  if (!pledge) {
    return NextResponse.json({ ok: false, error: "پذیرش تعهد اخلاقی الزامی است" }, { status: 400 });
  }

  const fresh = await db.user.findUnique({
    where: { id: user.id },
    select: { verificationStatus: true },
  });

  // «آزمون ارتقا»: تأییدشده‌ها هم می‌توانند دوباره آزمون بدهند
  if (fresh?.verificationStatus === "pending") {
    return NextResponse.json(
      { ok: false, error: "آزمون قبلی شما در حال داوری است — حداکثر ۷۲ ساعت نتیجه اعلام می‌شود" },
      { status: 400 },
    );
  }

  const req = await db.$transaction(async (tx) => {
    const created = await tx.verificationRequest.create({
      data: {
        userId: user.id,
        requestType: "pending", // داور موقع تصمیم پر می‌کند (bronze/silver/gold)
        fullName,
        bio: "",
        recitationVideoUrl: auditionUrl,
        socialLinks: null,
        achievements: null,
        auditionUrl,
        skills: JSON.stringify(skills),
        pledge: true,
        competitionId,
        competitionYear,
        status: "pending",
      },
    });

    // وضعیت pending می‌ماند/می‌شود؛ رنک فعلی تا اعلام نتیجه داوری جدید حفظ می‌شود
    await tx.user.update({
      where: { id: user.id },
      data: {
        verificationStatus: "pending",
        verificationNote: null,
      },
    });

    return created;
  });

  return NextResponse.json({ ok: true, requestId: req.id });
}

// GET /api/verify/request — وضعیت احراز و آخرین آزمون کاربر
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
  }

  const latest = await db.verificationRequest.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const fresh = await db.user.findUnique({
    where: { id: user.id },
    select: { verificationStatus: true, qariRank: true, verifiedAt: true, verificationNote: true },
  });

  return NextResponse.json({
    ok: true,
    status: fresh?.verificationStatus ?? "none",
    rank: fresh?.qariRank,
    verifiedAt: fresh?.verifiedAt?.getTime() ?? null,
    note: fresh?.verificationNote,
    lastExam: latest
      ? {
          id: latest.id,
          fullName: latest.fullName,
          status: latest.status,
          decidedRank: latest.requestType,
          auditionUrl: latest.auditionUrl ?? latest.recitationVideoUrl,
          adminNote: latest.adminNote,
          createdAt: latest.createdAt.getTime(),
        }
      : null,
  });
}
