import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { ArrowLeft, Clock, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerLogoutButton } from "../CustomerLogoutButton";
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

function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${date}T12:00:00+03:00`));
}

function buildBookingHref({
  serviceId,
  date,
  staffId,
}: {
  serviceId: string;
  date?: string;
  staffId?: string;
}) {
  const params = new URLSearchParams({ serviceId });

  if (date) {
    params.set("date", date);
  }

  if (staffId) {
    params.set("staffId", staffId);
  }

  return `/customer/booking?${params.toString()}`;
}

function buildConfirmHref({
  serviceId,
  date,
  staffId,
  time,
}: {
  serviceId: string;
  date: string;
  staffId: string;
  time: string;
}) {
  const params = new URLSearchParams({
    serviceId,
    date,
    staffId,
    time,
  });

  return `/customer/booking/confirm?${params.toString()}`;
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
  const params = (await searchParams) ?? {};

  if (!params.serviceId) {
    redirect("/customer/services");
  }

  const today = getTodayInIstanbul();
  const hasValidDate = isValidDate(params.date) && params.date! >= today;

  if (params.date && !hasValidDate) {
    redirect(buildBookingHref({ serviceId: params.serviceId }));
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
      redirect("/customer/login");
    }

    throw error;
  }

  const { context, service } = result;
  const { organizations, selectedOrganization } = context;

  if (organizations.length > 0 && !selectedOrganization) {
    redirect("/customer");
  }

  const selectedDate = hasValidDate ? params.date! : "";
  const availability = selectedDate
    ? (result as CustomerBookingAvailability)
    : null;

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/customer/services"
              className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Hizmetlere Dön
            </Link>
            <ArtexoBrand compact />
            <h1 className="text-2xl font-semibold">Randevu Tarihi Seç</h1>
          </div>
          <CustomerLogoutButton />
        </header>

        {organizations.length === 0 ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              Bu hesap herhangi bir işletmeye bağlı değil.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Randevu akışına devam etmek için işletme tarafından müşteri
              kaydınızın oluşturulması gerekir.
            </p>
          </section>
        ) : !service ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">Hizmet bulunamadı.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Seçtiğiniz hizmet pasif olabilir, kaldırılmış olabilir veya bağlı
              olduğunuz işletmeye ait olmayabilir.
            </p>
            <Link
              href="/customer/services"
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
            >
              Hizmetlere Dön
            </Link>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="text-sm text-muted-foreground">Seçilen hizmet</div>
                <h2 className="mt-1 text-2xl font-semibold">{service.name}</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1">
                    <Clock className="h-4 w-4" />
                    {service.duration_minutes} dk
                  </span>
                  {selectedDate && (
                    <span className="inline-flex items-center rounded-full border border-border px-3 py-1">
                      {formatDisplayDate(selectedDate)}
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
                  />
                </div>
              ) : null}
            </section>

            {availability && (
              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Personel ve saat seçimi</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Uygun personel ve müsait saatleri aşağıdan seçebilirsiniz.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Link
                      href={buildBookingHref({ serviceId: service.id })}
                      className="rounded-xl border border-border px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      Tarihi Değiştir
                    </Link>
                    <Link
                      href="/customer/services"
                      className="rounded-xl border border-border px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      Hizmetleri Değiştir
                    </Link>
                  </div>
                </div>

                {availability.staffMembers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center text-sm text-muted-foreground">
                    Bu hizmet için uygun personel bulunamadı.
                  </div>
                ) : availability.staffMembers.length > 1 && !availability.selectedStaff ? (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold">Personel seçin</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {availability.staffMembers.map((staffMember) => (
                        <Link
                          key={staffMember.id}
                          href={buildBookingHref({
                            serviceId: service.id,
                            date: selectedDate,
                            staffId: staffMember.id,
                          })}
                          className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm font-semibold transition hover:border-blue-500 hover:text-blue-300"
                        >
                          {staffMember.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : availability.slots.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center text-sm text-muted-foreground">
                    Bu tarih için uygun saat bulunamadı.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold">Uygun saatler</div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {availability.slots.map((slot) => (
                        <Link
                          key={slot.start_at}
                          href={buildConfirmHref({
                            serviceId: service.id,
                            date: selectedDate,
                            staffId: availability.selectedStaff!.id,
                            time: slot.start_time,
                          })}
                          className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-center text-sm font-semibold transition hover:border-blue-500 hover:bg-blue-600 hover:text-white"
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



