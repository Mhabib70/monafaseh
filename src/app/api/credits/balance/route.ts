import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/credits/balance — موجودی امتیاز کاربر
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
  }

  const fresh = await db.user.findUnique({
    where: { id: user.id },
    select: { creditBalance: true },
  });

  return NextResponse.json({ ok: true, balance: fresh?.creditBalance ?? 0 });
}
