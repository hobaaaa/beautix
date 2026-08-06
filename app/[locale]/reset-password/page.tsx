import { ResetPasswordContent } from "@/app/reset-password/page";
import { isLocale, type Locale } from "@/lib/i18n/constants";
import { notFound } from "next/navigation";

type LocalizedResetPasswordPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedResetPasswordPage({
  params,
}: LocalizedResetPasswordPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;

  return <ResetPasswordContent locale={locale} />;
}
