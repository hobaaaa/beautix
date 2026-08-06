import { AdminSettingsPageContent } from "@/app/admin/settings/page";
import { isLocale } from "@/lib/i18n/constants";
import { notFound } from "next/navigation";

type LocalizedAdminSettingsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedAdminSettingsPage({
  params,
}: LocalizedAdminSettingsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <AdminSettingsPageContent locale={locale} />;
}
