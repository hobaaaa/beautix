import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { ArrowLeft, Clock, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerLogoutButton } from "../CustomerLogoutButton";
import type { Locale } from "@/lib/i18n/constants";
import { getCustomerHref, getCustomerMessages } from "@/lib/i18n/customer";
import {
  CustomerAuthRequiredError,
  getCustomerBookingAvailability,
  getCustomerBookingService,
} from "../queries";
import type { CustomerBookingAvailability } from "../queries";
import { CustomerDateSelection } from "./CustomerDateSelection";

function getTodayInIstanbul() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date());
}

function isValidDate(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function formatDisplayDate(date: string, locale?: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${date}T12:00:00+03:00`));
}

function buildBookingHref({
  serviceId,
  date,
  staffId,
  localePrefix,
}: {
  serviceId: string;
  date?: string;
  staffId?: string;
  localePrefix?: Locale;
}) {
  const params = new URLSearchParams({ serviceId });

  if (date) {
    params.set("date", date);
  }

  if (staffId) {
    params.set("staffId", staffId);
  }

  return `${getCustomerHref("/booking", localePrefix)}?${params.toString()}`;
}

function buildConfirmHref({
  serviceId,
  date,
  staffId,
  time,
  localePrefix,
}: {
  serviceId: string;
  date: string;
  staffId: string;
  time: string;
  localePrefix?: Locale;
}) {
  const params = new URLSearchParams({
    serviceId,
    date,
    staffId,
    time,
  });

  return `${getCustomerHref(
    "/booking/confirm",
    localePrefix,
  )}?${params.toString()}`;
}

export async function CustomerBookingPageContent({
  localePrefix,
  searchParams,
}: {
  localePrefix?: Locale;
  searchParams?: Promise<{
    serviceId?: string;
    date?: string;
    staffId?: string;
  }>;
}) {
  const t = getCustomerMessages(localePrefix);
  const logoutMessages = {
    logout: t.logout,
    loggingOut: t.loggingOut,
    logoutFailed: t.logoutFailed,
  };
  const dateSelectionMessages = {
    dateRequired: t.dateRequired,
    pastDate: t.pastDate,
    appointmentDate: t.appointmentDate,
    continue: t.continue,
  };
  const params = (await searchParams) ?? {};

  if (!params.serviceId) {
    redirect(getCustomerHref("/services", localePrefix));
  }

  const today = getTodayInIstanbul();
  const hasValidDate = isValidDate(params.date) && params.date! >= today;

  if (params.date && !hasValidDate) {
    redirect(buildBookingHref({ serviceId: params.serviceId, localePrefix }));
  }

  let result;

  try {
    result = hasValidDate
      ? await getCustomerBookingAvailability({
          serviceId: params.serviceId,
          date: params.date!,
          staffId: params.staffId,
        })
      : await getCustomerBookingService(params.serviceId);
  } catch (error) {
    if (error instanceof CustomerAuthRequiredError) {
      redirect(getCustomerHref("/login", localePrefix));
    }

    throw error;
  }

  const { context, service } = result;
  const { organizations, selectedOrganization } = context;

  if (organizations.length > 0 && !selectedOrganization) {
    redirect(getCustomerHref("", localePrefix));
  }

  const selectedDate = hasValidDate ? params.date! : "";
  const availability = selectedDate
    ? (result as CustomerBookingAvailability)
    : null;

  return (
    <main className="min-h-dvh bg-background px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              href={getCustomerHref("/services", localePrefix)}
              className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.backToServices}
            </Link>
            <ArtexoBrand compact />
            <h1 className="text-2xl font-semibold">{t.bookingDateTitle}</h1>
          </div>
          <CustomerLogoutButton
            localePrefix={localePrefix}
            messages={logoutMessages}
          />
        </header>

        {organizations.length === 0 ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              {t.noOrganizationTitle}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {t.customerRecordRequiredForBooking}
            </p>
          </section>
        ) : !service ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">{t.serviceNotFoundTitle}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {t.serviceNotFoundDescription}
            </p>
            <Link
              href={getCustomerHref("/services", localePrefix)}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
            >
              {t.backToServices}
            </Link>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="text-sm text-muted-foreground">
                  {t.selectedService}
                </div>
                <h2 className="mt-1 text-2xl font-semibold">{service.name}</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1">
                    <Clock className="h-4 w-4" />
                    {service.duration_minutes} {t.minuteShort}
                  </span>
                  {selectedDate && (
                    <span className="inline-flex items-center rounded-full border border-border px-3 py-1">
                      {formatDisplayDate(selectedDate, localePrefix)}
                    </span>
                  )}
                  {availability?.selectedStaff && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1">
                      <UserRound className="h-4 w-4" />
                      {availability.selectedStaff.name}
                    </span>
                  )}
                </div>
              </div>

              {!selectedDate ? (
                <div className="mt-6">
                  <CustomerDateSelection
                    initialDate={selectedDate}
                    minDate={today}
                    serviceId={service.id}
                    bookingBaseHref={getCustomerHref("/booking", localePrefix)}
                    messages={dateSelectionMessages}
                  />
                </div>
              ) : null}
            </section>

            {availability && (
              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {t.staffAndTimeSelection}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t.staffAndTimeDescription}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap">
                    <Link
                      href={buildBookingHref({ serviceId: service.id, localePrefix })}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      {t.changeDate}
                    </Link>
                    <Link
                      href={getCustomerHref("/services", localePrefix)}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      {t.changeServices}
                    </Link>
                  </div>
                </div>

                {availability.staffMembers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center text-sm text-muted-foreground">
                    {t.noStaff}
                  </div>
                ) : availability.staffMembers.length > 1 && !availability.selectedStaff ? (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold">{t.chooseStaff}</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {availability.staffMembers.map((staffMember) => (
                        <Link
                          key={staffMember.id}
                          href={buildBookingHref({
                            serviceId: service.id,
                            date: selectedDate,
                            staffId: staffMember.id,
                            localePrefix,
                          })}
                          className="min-h-11 rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm font-semibold transition hover:border-blue-500 hover:text-blue-300"
                        >
                          {staffMember.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : availability.slots.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center text-sm text-muted-foreground">
                    {t.noSlots}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold">{t.availableTimes}</div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {availability.slots.map((slot) => (
                        <Link
                          key={slot.start_at}
                          href={buildConfirmHref({
                            serviceId: service.id,
                            date: selectedDate,
                            staffId: availability.selectedStaff!.id,
                            time: slot.start_time,
                            localePrefix,
                          })}
                          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border bg-background/60 px-4 py-3 text-center text-sm font-semibold transition hover:border-blue-500 hover:bg-blue-600 hover:text-white"
                        >
                          {slot.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default async function CustomerBookingPage({
  searchParams,
}: {
  searchParams?: Promise<{
    serviceId?: string;
    date?: string;
    staffId?: string;
  }>;
}) {
  return <CustomerBookingPageContent searchParams={searchParams} />;
}




