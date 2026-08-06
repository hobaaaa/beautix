"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const messages = {
  tr: {
    title: "Müşteri panelinde hata oluştu",
    description:
      "Sayfa yüklenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
    retry: "Tekrar Dene",
    back: "Müşteri Paneline Dön",
  },
  en: {
    title: "An error occurred in the customer panel",
    description:
      "An unexpected error occurred while loading the page. Please try again.",
    retry: "Try Again",
    back: "Back to Customer Panel",
  },
};

function getLocaleFromPathname(pathname: string) {
  return pathname.startsWith("/en/") ? "en" : "tr";
}

export default function LocalizedCustomerError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = messages[locale];

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t.description}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            {t.retry}
          </button>
          <Link
            href={`/${locale}/customer`}
            className="rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {t.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
