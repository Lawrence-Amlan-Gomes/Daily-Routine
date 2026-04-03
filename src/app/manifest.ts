import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Daily Routine",
    short_name: "DailyRoutine",
    description:
      "Plan routines, track goals, and stay productive with your daily dashboard.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/Icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
