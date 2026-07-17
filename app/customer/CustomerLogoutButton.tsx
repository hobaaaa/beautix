"use client";

import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CustomerLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/customer/logout", { method: "POST" });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, "Çıkış yapılırken bir hata oluştu."),
        );
      }

      router.replace("/customer/login");
      router.refresh();
    } catch (error) {
      setError(getClientErrorMessage(error, "Çıkış yapılırken bir hata oluştu."));
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {loading ? "Çıkış yapılıyor..." : "Çıkış Yap"}
      </button>
      {error && <div className="text-xs text-red-400">{error}</div>}
    </div>
  );
}

