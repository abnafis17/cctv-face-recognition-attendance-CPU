"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/authStorage";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const hasToken = !!getAccessToken();

  useEffect(() => {
    if (hasToken) return;
    const next =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/";
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [hasToken, router]);

  if (!hasToken) return null;
  return <>{children}</>;
}
