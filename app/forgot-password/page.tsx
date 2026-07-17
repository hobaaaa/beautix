"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const RESET_REQUEST_MESSAGE =
  "Eğer bu e-posta sistemde kayıtlıysa birkaç dakika içinde şifre sıfırlama bağlantısı gelir. Gelmezse spam klasörünü kontrol edin veya işletmeden hesap daveti isteyin.";

export default function ForgotPasswordPage() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("E-posta adresinizi girin.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const params = new URLSearchParams(window.location.search);
      const nextPath = params.get("next") ?? "/login";
      const redirectTo = `${window.location.origin}/reset-password?next=${encodeURIComponent(nextPath)}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo,
        },
      );

      if (resetError) {
        throw resetError;
      }

      setSuccess(RESET_REQUEST_MESSAGE);
    } catch (resetError) {
      console.error("Password reset request failed:", resetError);
      setSuccess(RESET_REQUEST_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-12 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-card-foreground shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Şifremi Unuttum</h1>
          <p className="text-sm text-muted-foreground">
            E-posta adresinizi girin, hesabınız varsa sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
              placeholder="ornek@artexo.com"
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
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
          </button>

          <div className="text-center text-sm">
            <Link href="/login" className="text-blue-600 hover:underline">
              Giriş ekranına dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



