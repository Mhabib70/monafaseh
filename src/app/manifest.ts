import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "منافسه — محفل زنده تلاوت و رقابت قرآنی",
    short_name: "منافسه",
    description:
      "پلتفرم آنلاین رقابت تلاوت قرآن کریم — محافل زنده، چالش رقابت، قاریان آنلاین",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0a08",
    theme_color: "#0b0a08",
    lang: "fa",
    dir: "rtl",
    categories: ["education", "social", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
