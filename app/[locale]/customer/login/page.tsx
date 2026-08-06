import { CustomerLoginForm } from "@/app/customer/login/CustomerLoginForm";
import { isLocale, type Locale } from "@/lib/i18n/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

type LocalizedCustomerLoginPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedCustomerLoginPage({
  params,
}: LocalizedCustomerLoginPageProps) {
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
    redirect("/customer");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
      <CustomerLoginForm locale={locale} />
    </main>
  );
}
