// src/app/layout.tsx
// This is the root layout for the Next.js application.
import { ThemeProvider } from "@/components/ThemeProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import ClientLayout from "./ClientLayout";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "https://mydailyroutine.app";
const siteName = "My Daily Routine";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "My Daily Routine | Plan Better Days",
    template: "%s | My Daily Routine",
  },
  description:
    "Plan your day, track goals, manage routines, and stay consistent with a clean productivity dashboard.",
  applicationName: siteName,
  keywords: [
    "daily routine app",
    "task planner",
    "productivity app",
    "goal tracker",
    "habit and routine",
    "time blocking app",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "My Daily Routine | Plan Better Days",
    description:
      "Plan your day, manage weekly routines, track goals, and improve consistency.",
    siteName,
    images: [
      {
        url: "/Icon.png",
        width: 1200,
        height: 630,
        alt: "My Daily Routine app",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Daily Routine | Plan Better Days",
    description:
      "Plan your day, manage routines, and track goals in one productivity app.",
    images: ["/Icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: ["/favicon.ico?v=4"],
    apple: ["/apple-touch-icon.png?v=4"],
    shortcut: ["/apple-touch-icon.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Script
          id="ld-json-webapp"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: siteName,
              applicationCategory: "ProductivityApplication",
              operatingSystem: "Web",
              description:
                "A web app to manage daily routines, goals, and productivity plans.",
              url: siteUrl,
            }),
          }}
        />
        <ThemeProvider>
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
