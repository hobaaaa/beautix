import { CustomerServicesPageContent } from "@/app/customer/services/page";
import { isLocale } from "@/lib/i18n/constants";
import { notFound } from "next/navigation";

export default async function LocalizedCustomerServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <CustomerServicesPageContent localePrefix={locale} />;
}
