"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function mapPasswordUpdateError(error: unknown) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase();

  if (message.includes("weak_password") || message.includes("weak password")) {
    return "Şifre güvenlik kurallarını karşılamıyor. Daha güçlü bir şifre belirleyin.";
  }

  if (
    message.includes("same_password") ||
    message.includes("different from the old password")
  ) {
    return "Yeni şifre eski şifrenizden farklı olmalıdır.";
  }

  if (
    message.includes("session") ||
    message.includes("jwt") ||
    message.includes("not authenticated")
  ) {
    return "Şifre belirleme bağlantısı geçersiz veya süresi dolmuş olabilir.";
  }

  return "Şifre güncellenirken bir hata oluştu.";
}

function cleanResetUrl(params: URLSearchParams) {
  const nextQuery = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`,
  );
}

export default function ResetPasswordPage() {
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
    const nextPath = params.get("next");

    if (nextPath?.startsWith("/")) {
      setReturnPath(nextPath);
    }

    if (params.get("error")) {
      setError("Şifre belirleme bağlantısı geçersiz veya süresi dolmuş olabilir.");
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
        setError("Şifre belirleme bağlantısı geçersiz veya süresi dolmuş olabilir.");
        setSessionReady(false);
      }
    }

    void preparePasswordResetSession();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleSubmit() {
    if (sessionReady !== true) {
      setError("Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş olabilir.");
      return;
    }

    if (!password) {
      setError("Yeni şifrenizi girin.");
      return;
    }

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    if (!passwordConfirm) {
      setError("Yeni şifrenizi tekrar girin.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor.");
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
      setSuccess("Şifreniz başarıyla güncellendi. Giriş ekranına yönlendiriliyorsunuz.");

      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const nextPath = params.get("next") ?? "/login";
        router.replace(nextPath.startsWith("/") ? nextPath : "/login");
        router.refresh();
      }, 1500);
    } catch (updateError) {
      console.error("Password update failed:", updateError);
      setError(mapPasswordUpdateError(updateError));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-card-foreground shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Yeni Şifre Oluştur</h1>
          <p className="text-sm text-muted-foreground">
            Hesabınız için yeni şifre belirleyin.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {sessionReady === false && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş olabilir.
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Yeni Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading || sessionReady !== true}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
              placeholder="En az 8 karakter"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Yeni Şifre Tekrar</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              disabled={loading || sessionReady !== true}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
              placeholder="Şifrenizi tekrar girin"
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
              ? "Bağlantı doğrulanıyor..."
              : loading
                ? "Şifre güncelleniyor..."
                : "Şifreyi Güncelle"}
          </button>

          <div className="text-center text-sm">
            <Link href={returnPath} className="text-blue-600 hover:underline">
              Giriş ekranına dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


