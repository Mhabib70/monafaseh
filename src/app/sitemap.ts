import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function getBaseUrl(): string {
  const raw =
    process.env.SITE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    "https://monafaseh.ir";
  return raw.replace(/\/+$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "hourly", priority: 1.0 },
    { url: `${baseUrl}/?view=sessions`, lastModified: now, changeFrequency: "always", priority: 0.9 },
    { url: `${baseUrl}/?view=masters`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${baseUrl}/?view=challenge`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${baseUrl}/?view=blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/?view=lounge`, lastModified: now, changeFrequency: "daily", priority: 0.75 },
  ];

  try {
    const [posts, masters] = await Promise.all([
      db.blogPost.findMany({
        where: { isPublished: true },
        select: { id: true, updatedAt: true },
        take: 100,
      }),
      db.user.findMany({
        where: { verificationStatus: "approved" },
        select: { id: true, updatedAt: true },
        take: 100,
      }),
    ]);

    const masterRoutes: MetadataRoute.Sitemap = masters.map((m) => ({
      url: `${baseUrl}/?user=${m.id}`,
      lastModified: m.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${baseUrl}/?view=blog&post=${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.65,
    }));

    return [...staticRoutes, ...masterRoutes, ...blogRoutes];
  } catch {
    return staticRoutes;
  }
}
