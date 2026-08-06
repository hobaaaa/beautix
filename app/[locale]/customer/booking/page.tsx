import { CustomerBookingPageContent } from "@/app/customer/booking/page";
import { isLocale } from "@/lib/i18n/constants";
import { notFound } from "next/navigation";

export default async function LocalizedCustomerBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    serviceId?: string;
    date?: string;
    staffId?: string;
  }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <CustomerBookingPageContent
      localePrefix={locale}
      searchParams={searchParams}
    />
  );
}
