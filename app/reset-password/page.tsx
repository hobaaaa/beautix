"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setSessionReady(Boolean(data.user));
    });

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

      setSuccess("Şifreniz başarıyla güncellendi. Giriş ekranına yönlendiriliyorsunuz.");

      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1500);
    } catch {
      setError("Şifre güncellenirken bir hata oluştu.");
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
            <Link href="/login" className="text-blue-600 hover:underline">
              Giriş ekranına dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
