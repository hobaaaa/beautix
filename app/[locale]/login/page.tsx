import { LoginForm } from "@/app/login/LoginForm";
import { isLocale, type Locale } from "@/lib/i18n/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

type LocalizedLoginPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedLoginPage({
  params,
}: LocalizedLoginPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(`/${locale}/admin`);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-12 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <LoginForm locale={locale} />
    </div>
  );
}
