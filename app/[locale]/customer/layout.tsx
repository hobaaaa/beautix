import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { isLocale } from "@/lib/i18n/constants";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export default async function LocalizedCustomerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <div className="relative">
      <div className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-40">
        <LanguageSwitcher
          currentLocale={locale}
          labels={{ tr: "TR", en: "EN" }}
        />
      </div>
      {children}
    </div>
  );
}
