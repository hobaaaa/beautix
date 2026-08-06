import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerLogoutButton } from "./CustomerLogoutButton";
import { CustomerOrganizationSelector } from "./CustomerOrganizationSelector";
import type { Locale } from "@/lib/i18n/constants";
import { getCustomerHref, getCustomerMessages } from "@/lib/i18n/customer";
import {
  CustomerAuthRequiredError,
  getCustomerDashboardContext,
  getCustomerOrganizationDisplayName,
} from "./queries";

export async function CustomerHomePageContent({
  localePrefix,
}: {
  localePrefix?: Locale;
}) {
  const t = getCustomerMessages(localePrefix);
  const logoutMessages = {
    logout: t.logout,
    loggingOut: t.loggingOut,
    logoutFailed: t.logoutFailed,
  };
  const organizationSelectorMessages = {
    chooseOrganizationTitle: t.chooseOrganizationTitle,
    chooseOrganizationDescription: t.chooseOrganizationDescription,
    organizationSelectFailed: t.organizationSelectFailed,
    choosing: t.choosing,
    choose: t.choose,
  };
  let context;

  try {
    context = await getCustomerDashboardContext();
  } catch (error) {
    if (error instanceof CustomerAuthRequiredError) {
      redirect(getCustomerHref("/login", localePrefix));
    }

    throw error;
  }

  const { organizations, selectedOrganization } = context;

  return (
    <main className="min-h-dvh bg-background px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-5">
          <div className="flex justify-end">
            <CustomerLogoutButton
              localePrefix={localePrefix}
              messages={logoutMessages}
            />
          </div>
          <div className="flex justify-center">
            <ArtexoBrand />
          </div>
          <h1 className="text-xl font-semibold">{t.dashboardTitle}</h1>
        </header>

        {organizations.length === 0 ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              {t.noOrganizationTitle}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {t.noOrganizationDescription}
            </p>
          </section>
        ) : selectedOrganization ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div className="text-sm font-medium text-blue-400">
              {getCustomerOrganizationDisplayName(selectedOrganization)}
            </div>
            <h2 className="mt-2 text-2xl font-semibold">
              {t.welcome(selectedOrganization.client_name)}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {t.dashboardDescription}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href={getCustomerHref("/services", localePrefix)}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
              >
                {t.viewServices}
              </Link>
              <Link
                href={getCustomerHref("/appointments", localePrefix)}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground sm:w-auto"
              >
                {t.myAppointments}
              </Link>
            </div>
          </section>
        ) : (
          <CustomerOrganizationSelector
            organizations={organizations}
            locale={localePrefix}
            messages={organizationSelectorMessages}
          />
        )}
      </div>
    </main>
  );
}

export default async function CustomerHomePage() {
  return <CustomerHomePageContent />;
}


