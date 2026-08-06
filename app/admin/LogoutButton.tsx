"use client";

import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import type { AdminMessages } from "@/lib/i18n/admin";
import { localeCookieName, locales, type Locale } from "@/lib/i18n/constants";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({
  compact = false,
  menuItem = false,
  messages,
  localePrefix,
}: {
  compact?: boolean;
  menuItem?: boolean;
  messages?: Pick<AdminMessages, "logout" | "loggingOut" | "logoutFailed">;
  localePrefix?: Locale;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const labels = messages ?? {
    logout: "Çıkış Yap",
    loggingOut: "Çıkış yapılıyor...",
    logoutFailed: "Çıkış yapılırken bir hata oluştu.",
  };

  function getLoginHref() {
    const cookieLocale = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${localeCookieName}=`))
      ?.split("=")[1] as Locale | undefined;

    if (localePrefix) {
      return `/${localePrefix}/login`;
    }

    if (cookieLocale && locales.includes(cookieLocale)) {
      return `/${cookieLocale}/login`;
    }

    return "/tr/login";
  }

  async function handleLogout() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, labels.logoutFailed),
        );
      }

      router.replace(getLoginHref());
      router.refresh();
    } catch (logoutError) {
      setError(
        getClientErrorMessage(logoutError, labels.logoutFailed),
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
        className={
          menuItem
            ? "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-200 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            : `rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50 ${
                compact ? "text-center" : "w-full text-left"
              }`
        }
      >
        {menuItem && <LogOut className="h-4 w-4" />}
        {loading ? labels.loggingOut : labels.logout}
      </button>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}

