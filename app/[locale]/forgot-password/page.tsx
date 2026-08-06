import { ForgotPasswordContent } from "@/app/forgot-password/page";
import { isLocale, type Locale } from "@/lib/i18n/constants";
import { notFound } from "next/navigation";

type LocalizedForgotPasswordPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedForgotPasswordPage({
  params,
}: LocalizedForgotPasswordPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;

  return <ForgotPasswordContent locale={locale} />;
}
