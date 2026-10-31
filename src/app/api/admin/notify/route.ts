import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// POST /api/admin/notify — ارسال اطلاعیه به همه کاربران
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { title, message, target } = await request.json();

  if (!title || !message) {
    return NextResponse.json({ ok: false, error: "عنوان و پیام الزامی است" }, { status: 400 });
  }

  // Create system messages in all lounges or specific lounge
  let loungeId = target;

  if (!loungeId || target === "all") {
    // Send to general lounge
    const generalLounge = await db.lounge.findFirst({
      where: { category: "general" },
    });
    loungeId = generalLounge?.id;
  }

  if (loungeId) {
    await db.loungeMessage.create({
      data: {
        loungeId,
        userId: admin.id,
        text: `📢 ${title}\n\n${message}`,
        type: "system",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    message: "اطلاعیه ارسال شد",
  });
}
