import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { ArrowLeft, CalendarPlus, Clock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerLogoutButton } from "../CustomerLogoutButton";
import type { Locale } from "@/lib/i18n/constants";
import { getCustomerHref, getCustomerMessages } from "@/lib/i18n/customer";
import {
  CustomerAuthRequiredError,
  getCustomerOrganizationDisplayName,
  getCustomerServices,
} from "../queries";

function formatPrice(price: string, locale?: Locale) {
  const numericPrice = Number(price);

  if (Number.isFinite(numericPrice)) {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 2,
    }).format(numericPrice);
  }

  return price;
}

export async function CustomerServicesPageContent({
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
  let result;

  try {
    result = await getCustomerServices();
  } catch (error) {
    if (error instanceof CustomerAuthRequiredError) {
      redirect(getCustomerHref("/login", localePrefix));
    }

    throw error;
  }

  const { context, services } = result;
  const { organizations, selectedOrganization } = context;

  if (organizations.length > 0 && !selectedOrganization) {
    redirect(getCustomerHref("", localePrefix));
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={getCustomerHref("", localePrefix)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.backToPanel}
            </Link>
            <CustomerLogoutButton
              localePrefix={localePrefix}
              messages={logoutMessages}
            />
          </div>
          <div className="flex justify-center">
            <ArtexoBrand />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{t.servicesTitle}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedOrganization
                ? t.servicesForOrganization(
                    getCustomerOrganizationDisplayName(selectedOrganization),
                  )
                : t.servicesNeedOrganization}
            </p>
          </div>
        </header>

        {organizations.length === 0 ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              {t.noOrganizationTitle}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {t.servicesNoOrganizationDescription}
            </p>
          </section>
        ) : services.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center">
            <h2 className="text-xl font-semibold">
              {t.noActiveServicesTitle}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.noActiveServicesDescription}
            </p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <article
                key={service.id}
                className="flex min-h-56 flex-col rounded-3xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-semibold">{service.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {service.description ??
                        t.noServiceDescription}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-600/15 p-3 text-blue-400">
                    <CalendarPlus className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {service.duration_minutes} {t.minuteShort}
                  </span>
                  {service.price && (
                    <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-muted-foreground">
                      {formatPrice(service.price, localePrefix)}
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-6">
                  <Link
                    href={`${getCustomerHref(
                      "/booking",
                      localePrefix,
                    )}?serviceId=${service.id}`}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    {t.bookAppointment}
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

export default async function CustomerServicesPage() {
  return <CustomerServicesPageContent />;
}



