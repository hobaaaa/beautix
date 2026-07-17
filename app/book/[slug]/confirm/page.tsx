import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { Clock3, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuestBookingForm } from "./GuestBookingForm";
import { getPublicBookingConfirmation } from "../queries";

type PublicBookingConfirmPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    serviceId?: string;
    date?: string;
    staffId?: string;
    time?: string;
  }>;
};

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "full",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${value}T12:00:00+03:00`));
}

function formatDuration(minutes: number) {
  return `${minutes} dakika`;
}

function buildSlotSelectionHref({
  slug,
  serviceId,
  date,
  staffId,
}: {
  slug: string;
  serviceId?: string;
  date?: string;
  staffId?: string;
}) {
  const params = new URLSearchParams();

  if (serviceId) params.set("serviceId", serviceId);
  if (date) params.set("date", date);
  if (staffId) params.set("staffId", staffId);

  const queryString = params.toString();

  return `/book/${encodeURIComponent(slug)}${queryString ? `?${queryString}` : ""}`;
}

function InvalidSelection({
  slug,
  serviceId,
  date,
  staffId,
}: {
  slug: string;
  serviceId?: string;
  date?: string;
  staffId?: string;
}) {
  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-2xl items-center justify-center">
        <section className="w-full rounded-3xl border bg-card p-6 text-center shadow-sm sm:p-8">
          <div className="mb-6 flex justify-center">
            <ArtexoBrand compact />
          </div>
          <h1 className="text-2xl font-semibold">Saat artık müsait değil</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Seçtiğiniz saat artık müsait değil. Lütfen başka bir saat seçin.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={buildSlotSelectionHref({ slug, serviceId, date, staffId })}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Saati Değiştir
            </Link>
            <Link
              href={`/book/${encodeURIComponent(slug)}`}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm"
            >
              Hizmeti Değiştir
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
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
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
      />
    );
  }

  const dateLabel = formatDateLabel(selectedDate);
  const durationLabel = formatDuration(selectedService.duration_minutes);
  const slotSelectionHref = buildSlotSelectionHref({
    slug: organization.public_slug,
    serviceId: selectedService.id,
    date: selectedDate,
    staffId: selectedStaff.id,
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
            <h1 className="text-3xl font-semibold">Randevu Bilgilerini Onaylayın</h1>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Randevu özetini kontrol edin ve iletişim bilgilerinizi girin.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Randevu Özeti</h2>
              <p className="text-sm text-muted-foreground">
                Seçtiğiniz saat tekrar kontrol edildi ve şu anda müsait.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={slotSelectionHref}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm"
              >
                Saati Değiştir
              </Link>
              <Link
                href={`/book/${encodeURIComponent(organization.public_slug)}`}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm"
              >
                Hizmeti Değiştir
              </Link>
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border bg-background p-4">
              <dt className="text-xs text-muted-foreground">İşletme</dt>
              <dd className="mt-1 break-words text-sm font-semibold">
                {organization.name}
              </dd>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <dt className="text-xs text-muted-foreground">Hizmet</dt>
              <dd className="mt-1 break-words text-sm font-semibold">
                {selectedService.name}
              </dd>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <dt className="text-xs text-muted-foreground">Personel</dt>
              <dd className="mt-1 flex items-center gap-2 break-words text-sm font-semibold">
                <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                {selectedStaff.name}
              </dd>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <dt className="text-xs text-muted-foreground">Tarih</dt>
              <dd className="mt-1 break-words text-sm font-semibold">{dateLabel}</dd>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <dt className="text-xs text-muted-foreground">Saat</dt>
              <dd className="mt-1 flex items-center gap-2 break-words text-sm font-semibold">
                <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" />
                {selectedSlot.start_time} - {selectedSlot.end_time}
              </dd>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <dt className="text-xs text-muted-foreground">Süre</dt>
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
