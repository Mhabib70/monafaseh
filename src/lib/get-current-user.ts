import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get("monafaseh-token")?.value;

    // پشتیبان: هدر x-auth-token — برای وقتی مرورگر کوکی را در
    // iframe پیش‌نمایش ذخیره/ارسال نمی‌کند
    if (!token) {
      const headerStore = await headers();
      token = headerStore.get("x-auth-token") ?? undefined;
    }

    if (!token) return null;

    const session = await db.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) return null;

    return session.user;
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}
