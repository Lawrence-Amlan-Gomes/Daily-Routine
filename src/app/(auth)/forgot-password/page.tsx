// src/app/(auth)/forgot-password/page.tsx
import ForgotPassword from "./ForgotPassword";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description:
    "Securely reset your My Daily Routine password using one-time verification code.",
  alternates: {
    canonical: "/forgot-password",
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}