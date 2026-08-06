import { PublicBookingSuccessPageContent } from "@/app/book/[slug]/success/page";
import { isLocale, type Locale } from "@/lib/i18n/constants";
import { notFound } from "next/navigation";

type LocalizedPublicBookingSuccessPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export default async function LocalizedPublicBookingSuccessPage({
  params,
}: LocalizedPublicBookingSuccessPageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;

  return PublicBookingSuccessPageContent({
    params: Promise.resolve({ slug }),
    locale,
    localePrefix: locale,
  });
}
