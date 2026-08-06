import { isLocale } from "@/lib/i18n/constants";
import { notFound } from "next/navigation";
import { CustomerHomePageContent } from "@/app/customer/page";

export default async function LocalizedCustomerHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <CustomerHomePageContent localePrefix={locale} />;
}
