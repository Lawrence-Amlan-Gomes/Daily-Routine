import type { Metadata } from "next";
import RefundPolicy from "@/components/RefundPolicy";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Read My Daily Routine refund policy for subscriptions and billing charges.",
  alternates: {
    canonical: "/refund-policy",
  },
};

export default function RefundPolicyPage() {
  return <RefundPolicy />;
}
