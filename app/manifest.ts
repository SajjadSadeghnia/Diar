import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "دیار | سامانه رزرو ویلای سازمانی",
    short_name: "دیار",
    description: "سامانه داخلی رزرو ویلای سازمانی دیار",
    start_url: "/login",
    display: "standalone",
    background_color: "#f2eee1",
    theme_color: "#1f3d34",
    lang: "fa",
    dir: "rtl",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
