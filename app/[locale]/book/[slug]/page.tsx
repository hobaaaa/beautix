import {
  defaultLocale,
  isLocale,
  type Locale,
} from "@/lib/i18n/constants";
import { getPublicBookingMessages } from "@/lib/i18n/public-booking";
import {
  PublicBookingPageContent,
  type PublicBookingPageProps,
} from "@/app/book/[slug]/page";
import { getPublicOrganizationBySlug } from "@/app/book/[slug]/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type LocalizedPublicBookingPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
  searchParams?: PublicBookingPageProps["searchParams"];
};

export async function generateMetadata({
  params,
}: LocalizedPublicBookingPageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const organization = await getPublicOrganizationBySlug(slug);
  const t = getPublicBookingMessages(locale);

  if (!organization) {
    return {
      title: t.metadataTitle,
    };
  }

  return {
    title: `${organization.name} | ${t.pageTitle}`,
  };
}

export default async function LocalizedPublicBookingPage({
  params,
  searchParams,
}: LocalizedPublicBookingPageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;

  return PublicBookingPageContent({
    params: Promise.resolve({ slug }),
    searchParams,
    locale,
    localePrefix: locale,
  });
}
