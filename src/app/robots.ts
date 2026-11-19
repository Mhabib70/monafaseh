import type { MetadataRoute } from "next";

function getBaseUrl(): string {
  const raw =
    process.env.SITE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    "https://monafaseh.ir";
  return raw.replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
