import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { ArrowLeft, CalendarDays, Clock, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerLogoutButton } from "../../CustomerLogoutButton";
import type { Locale } from "@/lib/i18n/constants";
import { getCustomerHref, getCustomerMessages } from "@/lib/i18n/customer";
import {
  CustomerAuthRequiredError,
  getCustomerBookingConfirmation,
} from "../../queries";
import { ConfirmAppointmentButton } from "./ConfirmAppointmentButton";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function getTodayInIstanbul() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date());
}

function formatDisplayDate(date: string, locale?: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${date}T12:00:00+03:00`));
}

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

  if (date) params.set("date", date);
  if (staffId) params.set("staffId", staffId);

  return `${getCustomerHref("/booking", localePrefix)}?${params.toString()}`;
}

export async function CustomerBookingConfirmPageContent({
  localePrefix,
  searchParams,
}: {
  localePrefix?: Locale;
  searchParams?: Promise<{
    serviceId?: string;
    date?: string;
    staffId?: string;
    time?: string;
  }>;
}) {
  const t = getCustomerMessages(localePrefix);
  const params = (await searchParams) ?? {};
  const today = getTodayInIstanbul();

  if (
    !params.serviceId ||
    !params.staffId ||
    !params.date ||
    !params.time ||
    !DATE_PATTERN.test(params.date) ||
    params.date < today ||
    !TIME_PATTERN.test(params.time)
  ) {
    redirect(getCustomerHref("/services", localePrefix));
  }

  let result;

  try {
    result = await getCustomerBookingConfirmation({
      serviceId: params.serviceId,
      date: params.date,
      staffId: params.staffId,
      time: params.time,
    });
  } catch (error) {
    if (error instanceof CustomerAuthRequiredError) {
      redirect(getCustomerHref("/login", localePrefix));
    }

    throw error;
  }

  const { context, service, selectedStaff, selectedSlot } = result;
  const { organizations, selectedOrganization } = context;

  if (organizations.length > 0 && !selectedOrganization) {
    redirect(getCustomerHref("", localePrefix));
  }

  const changeSlotHref = buildBookingHref({
    serviceId: params.serviceId,
    date: params.date,
    staffId: params.staffId,
    localePrefix,
  });

  return (
    <main className="min-h-dvh bg-background px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              href={changeSlotHref}
              className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.changeTime}
            </Link>
            <ArtexoBrand compact />
            <h1 className="text-2xl font-semibold">{t.bookingConfirmTitle}</h1>
          </div>
          <CustomerLogoutButton messages={t} />
        </header>

        {organizations.length === 0 ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              {t.noOrganizationTitle}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.bookingCreateNoOrganizationDescription}
            </p>
          </section>
        ) : !service || !selectedStaff || !selectedSlot ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              {t.selectedSlotUnavailableTitle}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.selectedSlotUnavailableDescription}
            </p>
            <Link
              href={changeSlotHref}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
            >
              {t.changeTime}
            </Link>
          </section>
        ) : (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="space-y-5">
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">{t.service}</div>
                <h2 className="mt-1 break-words text-2xl font-semibold">{service.name}</h2>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <UserRound className="h-4 w-4" />
                    {t.staff}
                  </div>
                  <div className="break-words font-semibold">{selectedStaff.name}</div>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {t.date}
                  </div>
                  <div className="font-semibold">
                    {formatDisplayDate(params.date, localePrefix)}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {t.time}
                  </div>
                  <div className="font-semibold">
                    {selectedSlot.start_time} - {selectedSlot.end_time}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="mb-2 text-muted-foreground">{t.duration}</div>
                  <div className="font-semibold">
                    {service.duration_minutes} {t.minuteShort}
                  </div>
                </div>
                {service.price && (
                  <div className="rounded-2xl border border-border bg-background/60 p-4 sm:col-span-2">
                    <div className="mb-2 text-muted-foreground">{t.price}</div>
                    <div className="font-semibold">
                      {formatPrice(service.price, localePrefix)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Link
                  href={changeSlotHref}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {t.changeTime}
                </Link>
                <ConfirmAppointmentButton
                  serviceId={service.id}
                  staffId={selectedStaff.id}
                  date={params.date}
                  time={selectedSlot.start_time}
                  successHref={getCustomerHref(
                    "/booking/success",
                    localePrefix,
                  )}
                  messages={t}
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default async function CustomerBookingConfirmPage({
  searchParams,
}: {
  searchParams?: Promise<{
    serviceId?: string;
    date?: string;
    staffId?: string;
    time?: string;
  }>;
}) {
  return <CustomerBookingConfirmPageContent searchParams={searchParams} />;
}


