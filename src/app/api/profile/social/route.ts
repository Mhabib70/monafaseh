import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// PATCH /api/profile/social — ویرایش شبکه‌های اجتماعی و مدارج (خود کاربر)
// body: { eitaa?, telegram?, instagram?, youtube?, website?, honors? }
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const clean = (v: unknown) => {
      const s = String(v ?? "").trim();
      if (!s) return null;
      if (s.length > 200) return null;
      return /^https?:\/\//.test(s) || /^[a-zA-Z0-9_.@]+$/.test(s) ? s : null;
    };

    const social = {
      eitaa: clean(body?.eitaa),
      telegram: clean(body?.telegram),
      instagram: clean(body?.instagram),
      youtube: clean(body?.youtube),
      website: clean(body?.website),
    };
    const honors = body?.honors !== undefined ? String(body.honors).trim().slice(0, 1000) : undefined;

    const data: Record<string, unknown> = { socialLinks: JSON.stringify(social) };
    if (honors !== undefined) data.honors = honors || null;

    await db.user.update({ where: { id: user.id }, data });

    return NextResponse.json({ ok: true, social });
  } catch (error) {
    console.error("Profile social error:", error);
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}
