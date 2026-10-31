import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/get-current-user";
import { validateEitaaInitData } from "@/lib/eitaa/validate";

// ============================================================
// POST /api/eitaa/link — اتصال حساب ایتا به حساب منافسه
// کاربر باید لاگین باشد؛ initData ایتا با توکن برنامه راستی‌آزمایی
// و eitaaId به حساب او متصل می‌شود تا دفعات بعد با یک ضربه وارد شود.
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: "ورود لازم است" },
        { status: 401 },
      );
    }

    const botToken = process.env.BOT_TOKEN ?? "";
    if (!botToken) {
      return NextResponse.json(
        { ok: false, error: "توکن برنامه ایتا روی سرور تنظیم نشده است" },
        { status: 501 },
      );
    }

    const body = await request.json();
    const initData = String(body?.initData ?? "");
    const result = validateEitaaInitData(initData, botToken);
    if (!result.ok || !result.user) {
      return NextResponse.json(
        { ok: false, error: result.reason ?? "داده ایتا نامعتبر است" },
        { status: 401 },
      );
    }

    // اگر این حساب ایتا قبلاً به حساب دیگری وصل شده، اجازه جابجایی نمی‌دهیم
    const taken = await db.user.findUnique({
      where: { eitaaId: result.user.id },
    });
    if (taken && taken.id !== currentUser.id) {
      return NextResponse.json(
        { ok: false, error: "این حساب ایتا قبلاً به حساب دیگری متصل شده است" },
        { status: 409 },
      );
    }

    await db.user.update({
      where: { id: currentUser.id },
      data: {
        eitaaId: result.user.id,
        eitaaUsername: result.user.username ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Eitaa] link error:", error);
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}
