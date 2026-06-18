import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "https://mydailyroutine.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/login",
    "/register",
    "/forgot-password",
    "/pricing",
    "/about",
    "/contact",
    "/testimonials",
    "/refund",
    "/privacy",
    "/terms-and-conditions",
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
