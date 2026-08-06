import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { defaultLocale, type Locale } from "@/lib/i18n/constants";
import {
  buildPublicBookingHref,
  getPublicBookingMessages,
  type PublicBookingMessages,
} from "@/lib/i18n/public-booking";
import { Clock3, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuestBookingForm } from "./GuestBookingForm";
import { getPublicBookingConfirmation } from "../queries";

export type PublicBookingConfirmPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    serviceId?: string;
    date?: string;
    staffId?: string;
    time?: string;
  }>;
  locale?: Locale;
  localePrefix?: Locale;
};

function formatDateLabel(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    dateStyle: "full",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${value}T12:00:00+03:00`));
}

function formatDuration(minutes: number, messages: PublicBookingMessages) {
  return `${minutes} ${messages.minute}`;
}

function buildSlotSelectionHref({
  slug,
  serviceId,
  date,
  staffId,
  localePrefix,
}: {
  slug: string;
  serviceId?: string;
  date?: string;
  staffId?: string;
  localePrefix?: Locale;
}) {
  const params = new URLSearchParams();

  if (serviceId) params.set("serviceId", serviceId);
  if (date) params.set("date", date);
  if (staffId) params.set("staffId", staffId);

  return buildPublicBookingHref({
    slug,
    localePrefix,
    params,
  });
}

function InvalidSelection({
  slug,
  serviceId,
  date,
  staffId,
  localePrefix,
  messages,
}: {
  slug: string;
  serviceId?: string;
  date?: string;
  staffId?: string;
  localePrefix?: Locale;
  messages: PublicBookingMessages;
}) {
  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-2xl items-center justify-center">
        <section className="w-full rounded-3xl border bg-card p-6 text-center shadow-sm sm:p-8">
          <div className="mb-6 flex justify-center">
            <ArtexoBrand compact />
          </div>
          <h1 className="text-2xl font-semibold">{messages.invalidSlotTitle}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            {messages.invalidSlotDescription}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={buildSlotSelectionHref({
                slug,
                serviceId,
                date,
                staffId,
                localePrefix,
              })}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {messages.changeTime}
            </Link>
            <Link
              href={buildPublicBookingHref({ slug, localePrefix })}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm"
            >
              {messages.changeService}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default async function PublicBookingConfirmPage({
  params,
  searchParams,
}: PublicBookingConfirmPageProps) {
  return PublicBookingConfirmPageContent({
    params,
    searchParams,
    locale: defaultLocale,
  });
}

export async function PublicBookingConfirmPageContent({
  params,
  searchParams,
  locale = defaultLocale,
  localePrefix,
}: PublicBookingConfirmPageProps) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const t = getPublicBookingMessages(locale);
  const {
    organization,
    selectedService,
    selectedDate,
    selectedStaff,
    selectedSlot,
  } = await getPublicBookingConfirmation({
    slug,
    serviceId: query.serviceId,
    date: query.date,
    staffId: query.staffId,
    time: query.time,
  });

  if (!organization) {
    notFound();
  }

  if (!selectedService || !selectedDate || !selectedStaff || !selectedSlot) {
    return (
      <InvalidSelection
        slug={organization.public_slug}
        serviceId={query.serviceId}
        date={query.date}
        staffId={query.staffId}
        localePrefix={localePrefix}
        messages={t}
      />
    );
  }

  const dateLabel = formatDateLabel(selectedDate, locale);
  const durationLabel = formatDuration(selectedService.duration_minutes, t);
  const slotSelectionHref = buildSlotSelectionHref({
    slug: organization.public_slug,
    serviceId: selectedService.id,
    date: selectedDate,
    staffId: selectedStaff.id,
    localePrefix,
  });

  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex justify-center">
            <ArtexoBrand compact />
          </div>
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">{organization.name}</p>
            <h1 className="text-3xl font-semibold">{t.confirmTitle}</h1>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              {t.confirmDescription}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{t.summaryTitle}</h2>
              <p className="text-sm text-muted-foreground">
                {t.summaryDescription}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={slotSelectionHref}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm"
              >
                {t.changeTime}
              </Link>
              <Link
                href={buildPublicBookingHref({
                  slug: organization.public_slug,
                  localePrefix,
                })}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm"
              >
                {t.changeService}
              </Link>
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border bg-background p-4">
              <dt className="text-xs text-muted-foreground">{t.business}</dt>
              <dd className="mt-1 break-words text-sm font-semibold">
                {organization.name}
              </dd>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <dt className="text-xs text-muted-foreground">{t.service}</dt>
              <dd className="mt-1 break-words text-sm font-semibold">
                {selectedService.name}
              </dd>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <dt className="text-xs text-muted-foreground">{t.staff}</dt>
              <dd className="mt-1 flex items-center gap-2 break-words text-sm font-semibold">
                <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                {selectedStaff.name}
              </dd>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <dt className="text-xs text-muted-foreground">{t.date}</dt>
              <dd className="mt-1 break-words text-sm font-semibold">{dateLabel}</dd>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <dt className="text-xs text-muted-foreground">{t.time}</dt>
              <dd className="mt-1 flex items-center gap-2 break-words text-sm font-semibold">
                <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" />
                {selectedSlot.start_time} - {selectedSlot.end_time}
              </dd>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <dt className="text-xs text-muted-foreground">{t.duration}</dt>
              <dd className="mt-1 break-words text-sm font-semibold">{durationLabel}</dd>
            </div>
          </dl>
        </section>

        <GuestBookingForm
          bookingSelection={{
            slug: organization.public_slug,
            serviceId: selectedService.id,
            staffId: selectedStaff.id,
            date: selectedDate,
            time: selectedSlot.start_time,
          }}
          slotSelectionHref={slotSelectionHref}
          successHref={buildPublicBookingHref({
            slug: organization.public_slug,
            localePrefix,
            path: "/success",
          })}
          locale={localePrefix}
          messages={t}
          summary={{
            organizationName: organization.name,
            serviceName: selectedService.name,
            staffName: selectedStaff.name,
            dateLabel,
            startTime: selectedSlot.start_time,
            endTime: selectedSlot.end_time,
            durationLabel,
          }}
        />
      </div>
    </main>
  );
}
