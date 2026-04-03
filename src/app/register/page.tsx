// src/app/register/page.tsx
import RegistrationForm from "@/components/RegistrationForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Create your My Daily Routine account to start planning your week, tracking goals, and improving consistency.",
  alternates: {
    canonical: "/register",
  },
};


const RegistrationPage = () => {
  return <RegistrationForm />;
};

export default RegistrationPage;
