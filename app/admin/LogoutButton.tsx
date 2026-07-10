"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({
  compact = false,
}: {
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Çıkış yapılırken bir hata oluştu.");
      }

      router.replace("/login");
      router.refresh();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Çıkış yapılırken bir hata oluştu.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className={`rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50 ${
          compact ? "text-center" : "w-full text-left"
        }`}
      >
        {loading ? "Çıkış yapılıyor..." : "Çıkış Yap"}
      </button>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
