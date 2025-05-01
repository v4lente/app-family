"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SairPage() {
  const router = useRouter();
  useEffect(() => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event('authChanged'));
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="text-lg">Saindo...</span>
    </div>
  );
}
