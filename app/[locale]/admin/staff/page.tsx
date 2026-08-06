import { StaffPageContent } from "@/app/admin/staff/page";
import { isLocale } from "@/lib/i18n/constants";
import { notFound } from "next/navigation";

type LocalizedStaffPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedStaffPage({
  params,
}: LocalizedStaffPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <StaffPageContent locale={locale} />;
}
