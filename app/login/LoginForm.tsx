"use client";

import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function mapAuthErrorMessage(message?: string) {
  if (!message) {
    return "Giriş yapılırken bir hata oluştu.";
  }

  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("email not confirmed") ||
    normalized.includes("invalid_credentials")
  ) {
    return "E-posta veya şifre hatalı.";
  }

  return "Giriş yapılırken bir hata oluştu.";
}

export function LoginForm() {
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("E-posta adresinizi girin.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }

    if (!password) {
      setError("Şifrenizi girin.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError) {
        throw authError;
      }

      router.replace("/admin");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? mapAuthErrorMessage(loginError.message)
          : "Giriş yapılırken bir hata oluştu.",
      );
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
          <h1 className="text-2xl font-semibold tracking-tight">İşletme Girişi</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Yönetim paneline erişmek için hesabınızla giriş yapın.
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
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-blue-500 disabled:opacity-50"
              placeholder="ornek@artexo.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={loading}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-blue-500 disabled:opacity-50"
              placeholder="Şifreniz"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={onLogin}
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          <div className="text-center text-sm">
            <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300">
              Şifremi unuttum
            </Link>
          </div>

          <div className="border-t border-white/10 pt-4 text-center text-sm">
            <Link href="/" className="text-muted-foreground transition hover:text-foreground">
              Geri
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


