"use client";

import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { readApiErrorMessage } from "@/lib/api/client-response";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function CustomerLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  async function handleLogin() {
    const trimmedEmail = email.trim().toLowerCase();

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

    if (!turnstileToken && process.env.NODE_ENV === "production") {
      setError("Güvenlik doğrulamasının tamamlanmasını bekleyin.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/customer/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        setError(await readApiErrorMessage(response, "Giriş yapılırken bir hata oluştu."));
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      router.replace("/customer");
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
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
          <h1 className="text-2xl font-semibold tracking-tight">Müşteri Girişi</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            İşletmede kayıtlı müşteri hesabınızla giriş yapın.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="customer-email" className="text-sm font-medium">
              E-posta
            </label>
            <input
              id="customer-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !loading) void handleLogin();
              }}
              autoComplete="email"
              disabled={loading}
              placeholder="ornek@email.com"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="customer-password" className="text-sm font-medium">
              Şifre
            </label>
            <input
              id="customer-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !loading) void handleLogin();
              }}
              autoComplete="current-password"
              disabled={loading}
              placeholder="Şifreniz"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <TurnstileWidget
            action="customer_login"
            token={turnstileToken}
            onTokenChange={handleTurnstileToken}
            resetKey={turnstileResetKey}
          />

          {error && (
            <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleLogin()}
            disabled={
              loading || (!turnstileToken && process.env.NODE_ENV === "production")
            }
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          <div className="text-center text-sm">
            <Link
              href="/forgot-password?next=/customer/login"
              className="text-blue-400 hover:text-blue-300"
            >
              Şifremi Unuttum
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


