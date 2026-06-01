import RefundPolicy from "@/components/RefundPolicy";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Refund and cancellation policy for My Daily Routine.",
  alternates: {
    canonical: "/refund",
  },
};

export const revalidate = false;

export default function RefundPolicyPage() {
  return <RefundPolicy />;
}
