import type { Metadata, Viewport } from "next";
import { Vazirmatn, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/noorcraft/pwa-register";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/noorcraft/theme-provider";

// Body font — clean, modern, highly legible Persian sans-serif
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "منافسه — محفل زنده تلاوت و رقابت قرآنی",
  description:
    "منافسه پلتفرم آنلاین رقابت تلاوت قرآن با تصویر و صدای زنده، نمایش همزمان قرآن، تشویق‌های سنتی و امتیازدهی تخصصی. در محفلی آنلاین شرکت کنید، تلاوت کنید و رقابت کنید.",
  keywords: [
    "منافسه",
    "Monafaseh",
    "تلاوت قرآن",
    "رقابت قرآنی",
    "منافسه قرآنی",
    "جیتسی",
    "محفل قرآنی",
    "Jitsi",
    "تلاوت آنلاین",
    "قرآن زنده",
  ],
  authors: [{ name: "Monafaseh Team" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "منافسه",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "منافسه — محفل زنده تلاوت و رقابت قرآنی",
    description: "محفلی برای رقابت تلاوت، تشویق و ارزیابی قرآنی",
    type: "website",
  },
};

// Mobile viewport — required for proper WebRTC camera behavior on iOS/Android.
// `viewportFit: "cover"` lets the layout use the full screen including notches.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf9ef" },
    { media: "(prefers-color-scheme: dark)", color: "#08080a" },
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
