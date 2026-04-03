import type { Metadata } from "next";
import CancellationPolicy from "@/components/CancellationPolicy";

export const metadata: Metadata = {
  title: "Cancellation Policy",
  description:
    "Read My Daily Routine cancellation policy for subscriptions and renewals.",
  alternates: {
    canonical: "/cancellation-policy",
  },
};

export default function CancellationPolicyPage() {
  return <CancellationPolicy />;
}
