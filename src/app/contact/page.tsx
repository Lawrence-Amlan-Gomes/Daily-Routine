import Contact from "@/components/Contact";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with My Daily Routine for billing questions, account issues, or feedback. We respond within 1–2 business days.",
  alternates: {
    canonical: "/contact",
  },
};

export const revalidate = false;

export default function ContactPage() {
  return <Contact />;
}
