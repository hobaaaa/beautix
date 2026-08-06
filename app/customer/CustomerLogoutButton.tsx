"use client";

import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import { localeCookieName, locales, type Locale } from "@/lib/i18n/constants";
import type { CustomerMessages } from "@/lib/i18n/customer";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CustomerLogoutButton({
  messages,
  localePrefix,
}: {
  messages?: Pick<CustomerMessages, "logout" | "loggingOut" | "logoutFailed">;
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
      return `/${localePrefix}/customer/login`;
    }

    if (cookieLocale && locales.includes(cookieLocale)) {
      return `/${cookieLocale}/customer/login`;
    }

    return "/tr/customer/login";
  }

  async function handleLogout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/customer/logout", { method: "POST" });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, labels.logoutFailed),
        );
      }

      router.replace(getLoginHref());
      router.refresh();
    } catch (error) {
      setError(getClientErrorMessage(error, labels.logoutFailed));
      setLoading(false);
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50 sm:px-4"
      >
        <LogOut className="h-4 w-4" />
        <span className="truncate">
          {loading ? labels.loggingOut : labels.logout}
        </span>
      </button>
      {error && <div className="text-xs text-red-400">{error}</div>}
    </div>
  );
}

