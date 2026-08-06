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

  return <>{children}</>;
}
