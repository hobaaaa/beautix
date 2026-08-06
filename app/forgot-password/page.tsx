"use client";

import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { readApiErrorMessage } from "@/lib/api/client-response";
import type { Locale } from "@/lib/i18n/constants";
import { getAuthMessages, getLocalizedAuthHref } from "@/lib/i18n/auth";
import Link from "next/link";
import { useCallback, useState } from "react";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeLoginReturnPath(value: string | null) {
  return value === "/customer/login" ? value : "/login";
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}

export function ForgotPasswordContent({ locale }: { locale?: Locale }) {
  const t = getAuthMessages(locale);
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  async function handleSubmit() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError(t.emailRequired);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError(t.emailInvalid);
      return;
    }

    if (!turnstileToken && process.env.NODE_ENV === "production") {
      setError(t.turnstileRequired);
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const params = new URLSearchParams(window.location.search);
      const nextPath = normalizeLoginReturnPath(params.get("next"));
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          next: nextPath,
          locale,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        setError(
          await readApiErrorMessage(
            response,
            t.resetFailed,
          ),
        );
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      setSuccess(t.resetRequestSuccess);
    } catch {
      setError(t.networkError);
      setTurnstileResetKey((current) => current + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-12 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-card-foreground shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.forgotPasswordTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.forgotPasswordDescription}
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
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
              placeholder={t.emailPlaceholder}
            />
          </div>

          <TurnstileWidget
            action="forgot_password"
            token={turnstileToken}
            onTokenChange={handleTurnstileToken}
            resetKey={turnstileResetKey}
            loadFailedMessage={t.turnstileLoadFailed}
            pendingMessage={t.turnstilePending}
          />

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              loading || (!turnstileToken && process.env.NODE_ENV === "production")
            }
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? t.sending : t.sendResetLink}
          </button>

          <div className="text-center text-sm">
            <Link
              href={getLocalizedAuthHref("/login", locale)}
              className="text-blue-600 hover:underline"
            >
              {t.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



