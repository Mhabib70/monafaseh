import { NextResponse } from "next/server";

// POST /api/auth/logout
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("monafaseh-token");
  return response;
}
