import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { CalendarDays, CalendarPlus, Clock3, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicDateSelection } from "./PublicDateSelection";
import { getPublicBookingData, getPublicOrganizationBySlug } from "./queries";

type PublicBookingPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    serviceId?: string;
    date?: string;
    staffId?: string;
  }>;
};

function formatDuration(minutes: number) {
  return `${minutes} dakika`;
}

function buildBookingHref(
  slug: string,
  params: {
    serviceId?: string;
    date?: string;
    staffId?: string;
    sectionId?: string;
  },
) {
  const query = new URLSearchParams();

  if (params.serviceId) query.set("serviceId", params.serviceId);
  if (params.date) query.set("date", params.date);
  if (params.staffId) query.set("staffId", params.staffId);

  const queryString = query.toString();
  const hash = params.sectionId ? `#${params.sectionId}` : "";

  return `/book/${encodeURIComponent(slug)}${queryString ? `?${queryString}` : ""}${hash}`;
}

export async function generateMetadata({
  params,
}: PublicBookingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const organization = await getPublicOrganizationBySlug(slug);

  if (!organization) {
    return {
      title: "Online Randevu | Artexo",
    };
  }

  return {
    title: `${organization.name} | Online Randevu`,
  };
}

export default async function PublicBookingPage({
  params,
  searchParams,
}: PublicBookingPageProps) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const {
    organization,
    services,
    selectedService,
    invalidSelectedService,
    selectedDate,
    invalidDate,
    staffMembers,
    selectedStaff,
    invalidSelectedStaff,
    slots,
    today,
  } = await getPublicBookingData({
    slug,
    serviceId: query.serviceId,
    date: query.date,
    staffId: query.staffId,
  });

  if (!organization) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex justify-center">
            <ArtexoBrand compact />
          </div>

          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">{organization.name}</p>
            <h1 className="text-3xl font-semibold">Online Randevu</h1>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Hizmet, tarih, personel ve uygun saat seçimini tamamlayın.
            </p>
          </div>
        </section>

        {invalidSelectedService ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Seçtiğiniz hizmet artık randevuya açık değil. Lütfen başka bir hizmet seçin.
          </div>
        ) : null}

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Hizmet Seçin</h2>
            <p className="text-sm text-muted-foreground">
              Randevu almak istediğiniz hizmeti seçin.
            </p>
          </div>

          {services.length === 0 ? (
            <div className="rounded-3xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
              Bu işletme şu anda online randevuya açık bir hizmet sunmuyor.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((service) => {
                const isSelected = selectedService?.id === service.id;

                return (
                  <article
                    key={service.id}
                    className={`flex min-w-0 flex-col rounded-3xl border bg-card p-5 shadow-sm transition-colors ${
                      isSelected ? "border-blue-500/70 bg-blue-500/10" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="break-words text-xl font-semibold">
                          {service.name}
                        </h3>
                        {service.description ? (
                          <p className="mt-2 break-words text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        ) : null}
                      </div>
                      <div
                        className={`shrink-0 rounded-2xl p-3 ${
                          isSelected ? "bg-blue-600 text-white" : "bg-blue-500/10 text-blue-300"
                        }`}
                        aria-hidden="true"
                      >
                        <CalendarPlus className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex min-h-9 items-center gap-2 rounded-full border px-3">
                        <Clock3 className="h-4 w-4" />
                        {formatDuration(service.duration_minutes)}
                      </span>
                      {service.price ? (
                        <span className="inline-flex min-h-9 items-center rounded-full border px-3">
                          {service.price}
                        </span>
                      ) : null}
                    </div>

                    <Link
                      href={buildBookingHref(organization.public_slug, {
                        serviceId: service.id,
                        sectionId: "date-selection",
                      })}
                      className={`mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium ${
                        isSelected
                          ? "border border-blue-500/50 text-blue-100"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {isSelected ? "Bu Hizmet Seçildi" : "Bu Hizmeti Seç"}
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {selectedService ? (
          <section
            id="date-selection"
            className="scroll-mt-6 rounded-3xl border bg-card p-5 shadow-sm"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Tarih Seçin</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedService.name} - {formatDuration(selectedService.duration_minutes)}
                </p>
              </div>
              <Link
                href={`/book/${encodeURIComponent(organization.public_slug)}`}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm"
              >
                Hizmeti Değiştir
              </Link>
            </div>

            {invalidDate ? (
              <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                Geçmiş veya geçersiz bir tarih seçilemez.
              </div>
            ) : null}

            <PublicDateSelection
              slug={organization.public_slug}
              serviceId={selectedService.id}
              initialDate={selectedDate ?? today}
              minDate={today}
            />
          </section>
        ) : null}

        {selectedService && selectedDate ? (
          <section
            id="staff-selection"
            className="scroll-mt-6 space-y-4 rounded-3xl border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Personel ve Saat</h2>
                <p className="text-sm text-muted-foreground">
                  Seçilen tarih: {selectedDate}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={buildBookingHref(organization.public_slug, {
                    serviceId: selectedService.id,
                    sectionId: "date-selection",
                  })}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm"
                >
                  Tarihi Değiştir
                </Link>
                <Link
                  href={`/book/${encodeURIComponent(organization.public_slug)}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm"
                >
                  Hizmeti Değiştir
                </Link>
              </div>
            </div>

            {staffMembers.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                Bu hizmet için uygun personel bulunamadı.
              </div>
            ) : staffMembers.length > 1 ? (
              <div className="space-y-3">
                <h3 className="font-semibold">Personel Seçin</h3>
                {invalidSelectedStaff ? (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    Seçtiğiniz personel bu hizmet için uygun değil. Lütfen başka bir personel seçin.
                  </div>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  {staffMembers.map((staff) => {
                    const isSelected = selectedStaff?.id === staff.id;

                    return (
                      <Link
                        key={staff.id}
                        href={buildBookingHref(organization.public_slug, {
                          serviceId: selectedService.id,
                          date: selectedDate,
                          staffId: staff.id,
                          sectionId: "slot-selection",
                        })}
                        className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                          isSelected ? "border-blue-500/70 bg-blue-500/10 text-blue-100" : ""
                        }`}
                      >
                        <UserRound className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="break-words font-medium">{staff.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {selectedStaff ? (
              <div id="slot-selection" className="scroll-mt-6 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Uygun Saatler</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedStaff.name} için uygun saatler.
                    </p>
                  </div>
                  {staffMembers.length > 1 ? (
                    <Link
                      href={buildBookingHref(organization.public_slug, {
                        serviceId: selectedService.id,
                        date: selectedDate,
                        sectionId: "staff-selection",
                      })}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm"
                    >
                      Personeli Değiştir
                    </Link>
                  ) : null}
                </div>

                {slots.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                    <CalendarDays className="mx-auto mb-3 h-6 w-6" />
                    Bu tarih için uygun saat bulunamadı.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {slots.map((slot) => (
                      <Link
                        key={slot.start_at}
                        href={`/book/${encodeURIComponent(
                          organization.public_slug,
                        )}/confirm?${new URLSearchParams({
                          serviceId: selectedService.id,
                          date: selectedDate,
                          staffId: selectedStaff.id,
                          time: slot.start_time,
                        }).toString()}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-2xl border bg-background px-4 py-2 text-sm font-semibold transition hover:border-blue-500 hover:text-blue-100"
                      >
                        {slot.start_time}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
