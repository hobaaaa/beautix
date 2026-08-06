import { AdminLayoutContent } from "@/app/admin/layout";
import { isLocale } from "@/lib/i18n/constants";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export default async function LocalizedAdminLayout({
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

  return <AdminLayoutContent localePrefix={locale}>{children}</AdminLayoutContent>;
}
