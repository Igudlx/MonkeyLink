"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

export default function Home() {
  const router = useRouter();
  const { user, loading, configError } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [user, loading, router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        color: configError ? "var(--red)" : "var(--text3)",
        fontSize: 14,
        padding: 24,
        textAlign: "center",
      }}
    >
      {configError || "Loading…"}
    </div>
  );
}
