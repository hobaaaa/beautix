import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { CalendarPlus, Clock3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicBookingData, getPublicOrganizationBySlug } from "./queries";

type PublicBookingPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    serviceId?: string;
  }>;
};

function formatDuration(minutes: number) {
  return `${minutes} dakika`;
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
  const { organization, services, selectedService, invalidSelectedService } =
    await getPublicBookingData({
      slug,
      serviceId: query.serviceId,
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
              Randevu almak istediğiniz hizmeti seçin.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Hizmet Seçin</h2>
            <p className="text-sm text-muted-foreground">
              Randevu almak istediğiniz hizmeti seçin.
            </p>
          </div>

          {invalidSelectedService ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Seçtiğiniz hizmet artık randevuya açık değil. Lütfen başka bir hizmet seçin.
            </div>
          ) : null}

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

                    {isSelected ? (
                      <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-100">
                        Seçili hizmet: {service.name} - {formatDuration(service.duration_minutes)}
                      </div>
                    ) : null}

                    <Link
                      href={`/book/${encodeURIComponent(organization.public_slug)}?serviceId=${encodeURIComponent(
                        service.id,
                      )}`}
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
      </div>
    </main>
  );
}
