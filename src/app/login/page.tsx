// src/app/login/page.tsx
import LoginForm from "@/components/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Log in to your My Daily Routine account to manage your routine, goals, and productivity dashboard.",
  alternates: {
    canonical: "/login",
  },
};

export const revalidate = false;

const LoginPage = () => {
  return <LoginForm />;
};

export default LoginPage;
