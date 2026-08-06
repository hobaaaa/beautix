import { CustomerAppointmentsPageContent } from "@/app/customer/appointments/page";
import { isLocale } from "@/lib/i18n/constants";
import { notFound } from "next/navigation";

export default async function LocalizedCustomerAppointmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <CustomerAppointmentsPageContent localePrefix={locale} />;
}
