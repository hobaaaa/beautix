import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import enMessages from "@/messages/en.json";
import trMessages from "@/messages/tr.json";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type LocalizedHomePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

const messages = {
  tr: trMessages.home,
  en: enMessages.home,
} satisfies Record<Locale, typeof trMessages.home>;

async function resolveSignedInDestination() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1);

  if (!membershipError && memberships && memberships.length > 0) {
    return "/admin";
  }

  const { data: customerOrganizations, error: customerError } = await supabase.rpc(
    "link_customer_clients",
  );

  if (
    !customerError &&
    Array.isArray(customerOrganizations) &&
    customerOrganizations.length > 0
  ) {
    return "/customer";
  }

  return null;
}

export default async function LocalizedHomePage({
  params,
}: LocalizedHomePageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const destination = await resolveSignedInDestination();

  if (destination) {
    redirect(destination);
  }

  const locale = localeParam;
  const t = messages[locale];

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
      <main className="w-full max-w-md rounded-3xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <div className="flex justify-end">
          <div className="space-y-2 text-right">
            <p className="text-xs text-muted-foreground">{t.languageLabel}</p>
            <LanguageSwitcher
              currentLocale={locale}
              labels={{ tr: t.turkish, en: t.english }}
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <ArtexoBrand />
          <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{t.description}</p>
        </div>

        <div className="mt-8 grid gap-3">
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-4 text-sm font-medium text-primary-foreground"
          >
            {t.businessLogin}
          </Link>
          <Link
            href={`/${locale}/customer/login`}
            className="inline-flex items-center justify-center rounded-2xl border px-5 py-4 text-sm font-medium"
          >
            {t.customerLogin}
          </Link>
        </div>
      </main>
    </div>
  );
}
