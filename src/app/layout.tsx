import type { Metadata, Viewport } from "next";
import { Vazirmatn, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/noorcraft/pwa-register";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/noorcraft/theme-provider";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = (
  process.env.SITE_URL ||
  process.env.NEXTAUTH_URL ||
  process.env.APP_URL ||
  "https://monafaseh.ir"
).replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "منافسه — محفل زنده تلاوت و رقابت قرآنی",
    template: "%s | منافسه",
  },
  description:
    "منافسه پلتفرم تخصصی برگزاری محافل زنده تلاوت قرآن، چالش رقابت قاریان، رزرو جلسه خصوصی با استادان احراز هویت‌شده، نمایش همزمان مصحف و امتیازدهی تخصصی.",
  keywords: [
    "منافسه",
    "Monafaseh",
    "تلاوت قرآن",
    "رقابت قرآنی",
    "محفل قرآنی آنلاین",
    "آموزش تجوید و صوت و لحن",
    "قاریان ممتاز",
    "تحقیق و ترتیل",
  ],
  authors: [{ name: "منافسه" }],
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "منافسه",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192-v2.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512-v2.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon-v2.png",
  },
  openGraph: {
    title: "منافسه — محفل زنده تلاوت و رقابت قرآنی",
    description:
      "گردهمایی زنده قاریان قرآن، رقابت دوستانه، تحمید جمعی و جلسات خصوصی با استادان تلاوت",
    type: "website",
    url: "/",
    siteName: "منافسه",
    locale: "fa_IR",
    images: [
      {
        url: "/images/editorial/hero-recitation.jpg",
        width: 1280,
        height: 720,
        alt: "منافسه — پلتفرم محافل زنده تلاوت قرآن کریم",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "منافسه — محفل زنده تلاوت و رقابت قرآنی",
    description:
      "پلتفرم آنلاین محافل تلاوت قرآن کریم با حضور قاریان ممتاز و رقابت دوستانه",
    images: ["/images/editorial/hero-recitation.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf9ef" },
    { media: "(prefers-color-scheme: dark)", color: "#08080a" },
  ],
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "منافسه",
      alternateName: "Monafaseh",
      url: siteUrl,
      logo: `${siteUrl}/icons/icon-512-v2.png`,
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#webapp`,
      name: "منافسه — محفل زنده تلاوت و رقابت قرآنی",
      url: siteUrl,
      applicationCategory: "EducationalApplication",
      operatingSystem: "All",
      inLanguage: "fa-IR",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "IRR",
      },
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <PwaRegister />
          <Toaster />
          <Sonner />
        </ThemeProvider>
      </body>
    </html>
  );
}
