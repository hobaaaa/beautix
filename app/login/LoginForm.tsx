"use client";

import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { readApiErrorMessage } from "@/lib/api/client-response";
import type { Locale } from "@/lib/i18n/constants";
import { getAuthMessages, getLocalizedAuthHref } from "@/lib/i18n/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LoginForm({ locale }: { locale?: Locale }) {
  const t = getAuthMessages(locale);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  async function onLogin() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError(t.emailRequired);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError(t.emailInvalid);
      return;
    }

    if (!password) {
      setError(t.passwordRequired);
      return;
    }

    if (!turnstileToken && process.env.NODE_ENV === "production") {
      setError(t.turnstileRequired);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          locale,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        setError(await readApiErrorMessage(response, t.loginFailed));
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError(t.networkError);
      setTurnstileResetKey((current) => current + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-white/10 bg-card p-6 text-card-foreground shadow-2xl sm:p-8">
        <div className="mb-7 flex justify-center">
          <ArtexoBrand />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.adminLoginTitle}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {t.adminLoginDescription}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.email}</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-blue-500 disabled:opacity-50"
              placeholder={t.emailPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t.password}</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={loading}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-blue-500 disabled:opacity-50"
              placeholder={t.passwordPlaceholder}
            />
          </div>

          <TurnstileWidget
            action="admin_login"
            token={turnstileToken}
            onTokenChange={handleTurnstileToken}
            resetKey={turnstileResetKey}
            loadFailedMessage={t.turnstileLoadFailed}
            pendingMessage={t.turnstilePending}
          />

          {error && (
            <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={onLogin}
            disabled={
              loading || (!turnstileToken && process.env.NODE_ENV === "production")
            }
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t.loggingIn : t.loginButton}
          </button>

          <div className="text-center text-sm">
            <Link
              href={getLocalizedAuthHref("/forgot-password", locale)}
              className="text-blue-400 hover:text-blue-300"
            >
              {t.forgotPassword}
            </Link>
          </div>

          <div className="border-t border-white/10 pt-4 text-center text-sm">
            <Link
              href={locale ? `/${locale}` : "/"}
              className="text-muted-foreground transition hover:text-foreground"
            >
              {t.back}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


