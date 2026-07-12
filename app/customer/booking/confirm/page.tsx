import { ArrowLeft, CalendarDays, Clock, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerLogoutButton } from "../../CustomerLogoutButton";
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

function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${date}T12:00:00+03:00`));
}

function formatPrice(price: string) {
  const numericPrice = Number(price);

  if (Number.isFinite(numericPrice)) {
    return new Intl.NumberFormat("tr-TR", {
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
}: {
  serviceId: string;
  date?: string;
  staffId?: string;
}) {
  const params = new URLSearchParams({ serviceId });

  if (date) params.set("date", date);
  if (staffId) params.set("staffId", staffId);

  return `/customer/booking?${params.toString()}`;
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
    redirect("/customer/services");
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
      redirect("/customer/login");
    }

    throw error;
  }

  const { context, service, selectedStaff, selectedSlot } = result;
  const { organizations, selectedOrganization } = context;

  if (organizations.length > 0 && !selectedOrganization) {
    redirect("/customer");
  }

  const changeSlotHref = buildBookingHref({
    serviceId: params.serviceId,
    date: params.date,
    staffId: params.staffId,
  });

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link
              href={changeSlotHref}
              className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Saati Değiştir
            </Link>
            <div className="text-sm font-medium text-blue-400">Artexo</div>
            <h1 className="text-2xl font-semibold">Randevu Onayı</h1>
          </div>
          <CustomerLogoutButton />
        </header>

        {organizations.length === 0 ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              Bu hesap herhangi bir işletmeye bağlı değil.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Randevu oluşturmak için işletme tarafından müşteri kaydınızın
              oluşturulması gerekir.
            </p>
          </section>
        ) : !service || !selectedStaff || !selectedSlot ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">Seçilen saat müsait değil.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hizmet, personel veya saat seçimi artık geçerli olmayabilir. Lütfen
              başka bir saat seçin.
            </p>
            <Link
              href={changeSlotHref}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
            >
              Saati Değiştir
            </Link>
          </section>
        ) : (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="space-y-5">
              <div>
                <div className="text-sm text-muted-foreground">Hizmet</div>
                <h2 className="mt-1 text-2xl font-semibold">{service.name}</h2>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <UserRound className="h-4 w-4" />
                    Personel
                  </div>
                  <div className="font-semibold">{selectedStaff.name}</div>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    Tarih
                  </div>
                  <div className="font-semibold">{formatDisplayDate(params.date)}</div>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Saat
                  </div>
                  <div className="font-semibold">
                    {selectedSlot.start_time} - {selectedSlot.end_time}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="mb-2 text-muted-foreground">Süre</div>
                  <div className="font-semibold">{service.duration_minutes} dk</div>
                </div>
                {service.price && (
                  <div className="rounded-2xl border border-border bg-background/60 p-4 sm:col-span-2">
                    <div className="mb-2 text-muted-foreground">Fiyat</div>
                    <div className="font-semibold">{formatPrice(service.price)}</div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Link
                  href={changeSlotHref}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  Saati Değiştir
                </Link>
                <ConfirmAppointmentButton
                  serviceId={service.id}
                  staffId={selectedStaff.id}
                  date={params.date}
                  time={selectedSlot.start_time}
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
