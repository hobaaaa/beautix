import { HoursPageContent } from "@/app/admin/hours/page";
import { isLocale } from "@/lib/i18n/constants";
import { notFound } from "next/navigation";

type LocalizedHoursPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedHoursPage({
  params,
}: LocalizedHoursPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <HoursPageContent locale={locale} />;
}
