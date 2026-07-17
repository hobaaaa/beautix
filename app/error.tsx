"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Bir hata oluştu</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          İşlem sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Başlangıca Dön
          </Link>
        </div>
      </section>
    </main>
  );
}


