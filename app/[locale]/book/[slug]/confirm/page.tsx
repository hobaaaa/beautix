import {
  PublicBookingConfirmPageContent,
  type PublicBookingConfirmPageProps,
} from "@/app/book/[slug]/confirm/page";
import { isLocale, type Locale } from "@/lib/i18n/constants";
import { notFound } from "next/navigation";

type LocalizedPublicBookingConfirmPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
  searchParams?: PublicBookingConfirmPageProps["searchParams"];
};

export default async function LocalizedPublicBookingConfirmPage({
  params,
  searchParams,
}: LocalizedPublicBookingConfirmPageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;

  return PublicBookingConfirmPageContent({
    params: Promise.resolve({ slug }),
    searchParams,
    locale,
    localePrefix: locale,
  });
}
