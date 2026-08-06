import { CustomerBookingConfirmPageContent } from "@/app/customer/booking/confirm/page";
import { isLocale } from "@/lib/i18n/constants";
import { notFound } from "next/navigation";

export default async function LocalizedCustomerBookingConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    serviceId?: string;
    date?: string;
    staffId?: string;
    time?: string;
  }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <CustomerBookingConfirmPageContent
      localePrefix={locale}
      searchParams={searchParams}
    />
  );
}
