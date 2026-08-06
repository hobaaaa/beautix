"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/constants";
import { getAuthMessages } from "@/lib/i18n/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function mapPasswordUpdateError(
  error: unknown,
  messages = getAuthMessages(),
) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase();

  if (message.includes("weak_password") || message.includes("weak password")) {
    return messages.passwordWeak;
  }

  if (
    message.includes("same_password") ||
    message.includes("different from the old password")
  ) {
    return messages.passwordSame;
  }

  if (
    message.includes("session") ||
    message.includes("jwt") ||
    message.includes("not authenticated")
  ) {
    return messages.resetLinkInvalid;
  }

  return messages.passwordUpdateFailed;
}

function cleanResetUrl(params: URLSearchParams) {
  const nextQuery = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`,
  );
}

function normalizeLoginReturnPath(value: string | null) {
  return value === "/customer/login" ? value : "/login";
}

function localizeReturnPath(returnPath: string, locale?: Locale) {
  return locale ? `/${locale}${returnPath}` : returnPath;
}

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}

export function ResetPasswordContent({ locale }: { locale?: Locale }) {
  const t = getAuthMessages(locale);
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);
  const [returnPath, setReturnPath] = useState("/login");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    setReturnPath(normalizeLoginReturnPath(params.get("next")));

    if (params.get("error")) {
      setError(t.resetLinkInvalid);
      setSessionReady(false);
      return () => {
        active = false;
      };
    }

    async function preparePasswordResetSession() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const code = params.get("code");

      try {
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }

          if (!active) return;
          cleanResetUrl(params);
          setSessionReady(true);
          return;
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }

          params.delete("code");

          if (!active) return;
          cleanResetUrl(params);
          setSessionReady(true);
          return;
        }

        if (!active) return;
        setSessionReady(false);
      } catch (sessionError) {
        console.error("Password reset session failed:", sessionError);
        if (!active) return;
        setError(t.resetLinkInvalid);
        setSessionReady(false);
      }
    }

    void preparePasswordResetSession();

    return () => {
      active = false;
    };
  }, [supabase, t.resetLinkInvalid]);

  async function handleSubmit() {
    if (sessionReady !== true) {
      setError(t.resetLinkInvalid);
      return;
    }

    if (!password) {
      setError(t.newPasswordRequired);
      return;
    }

    if (password.length < 8) {
      setError(t.newPasswordMinLength);
      return;
    }

    if (!passwordConfirm) {
      setError(t.passwordConfirmRequired);
      return;
    }

    if (password !== passwordConfirm) {
      setError(t.passwordsDoNotMatch);
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      await supabase.auth.signOut();
      setSuccess(t.passwordUpdateSuccess);

      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const nextPath = normalizeLoginReturnPath(params.get("next"));
        router.replace(localizeReturnPath(nextPath, locale));
        router.refresh();
      }, 1500);
    } catch (updateError) {
      console.error("Password update failed:", updateError);
      setError(mapPasswordUpdateError(updateError, t));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-12 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-card-foreground shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.resetPasswordTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.resetPasswordDescription}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {sessionReady === false && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {t.resetLinkInvalid}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">{t.newPassword}</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading || sessionReady !== true}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
              placeholder={t.newPasswordPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t.newPasswordConfirm}</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              disabled={loading || sessionReady !== true}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
              placeholder={t.newPasswordConfirmPlaceholder}
            />
          </div>

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
            disabled={loading || sessionReady !== true}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {sessionReady === null
              ? t.verifyLink
              : loading
                ? t.updatingPassword
                : t.updatePassword}
          </button>

          <div className="text-center text-sm">
            <Link
              href={localizeReturnPath(returnPath, locale)}
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



