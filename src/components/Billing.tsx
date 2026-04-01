// src/components/Billing.tsx
"use client";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PaddleForm from "./PaddleForm";


export default function Billing() {
  const { user: auth } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      router.push("/login");
    }
  }, [auth, router]);

  return (
    <div
      className={`min-h-screen w-full pt-[100px] flex flex-col items-center justify-center p-6 ${
        theme ? "bg-[#ffffff] text-[#0a0a0a]" : "bg-[#000000] text-[#ebebeb]"
      }`}
    >
        {/* PaddleForm handles opening the checkout */}
        <PaddleForm />
    </div>
  );
}
