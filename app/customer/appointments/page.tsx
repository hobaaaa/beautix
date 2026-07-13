import { ArrowLeft, CalendarDays, Clock, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { AppointmentStatus } from "../../../types";
import { CustomerLogoutButton } from "../CustomerLogoutButton";
import {
  CustomerAuthRequiredError,
  getCustomerAppointments,
} from "../queries";
import type { CustomerAppointmentListItem } from "../queries";
import { CancelAppointmentButton } from "./CancelAppointmentButton";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  confirmed: "bg-blue-500/15 text-blue-200",
  completed: "bg-emerald-500/15 text-emerald-200",
  cancelled: "bg-red-500/15 text-red-200",
  no_show: "bg-amber-500/15 text-amber-200",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: "Onaylandı",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
  no_show: "Gelmedi",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function canCancelAppointment(appointment: CustomerAppointmentListItem) {
  return (
    appointment.status === "confirmed" &&
    new Date(appointment.start_at).getTime() > Date.now()
  );
}

function AppointmentCard({
  appointment,
}: {
  appointment: CustomerAppointmentListItem;
}) {
  const canCancel = canCancelAppointment(appointment);

  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Hizmet</div>
          <h3 className="mt-1 text-xl font-semibold">{appointment.service.name}</h3>
        </div>
        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[appointment.status]}`}
        >
          {STATUS_LABELS[appointment.status]}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Tarih
          </div>
          <div className="font-semibold">{formatDate(appointment.start_at)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            Saat
          </div>
          <div className="font-semibold">{formatTime(appointment.start_at)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <UserRound className="h-4 w-4" />
            Personel
          </div>
          <div className="font-semibold">{appointment.staff.name}</div>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 text-muted-foreground">Süre</div>
          <div className="font-semibold">{appointment.service.duration_minutes} dk</div>
        </div>
      </div>

      {canCancel && (
        <div className="mt-5 flex justify-end">
          <CancelAppointmentButton appointmentId={appointment.id} />
        </div>
      )}
    </article>
  );
}

function AppointmentSection({
  title,
  emptyMessage,
  appointments,
}: {
  title: string;
  emptyMessage: string;
  appointments: CustomerAppointmentListItem[];
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {appointments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function CustomerAppointmentsPage() {
  let result;

  try {
    result = await getCustomerAppointments();
  } catch (error) {
    if (error instanceof CustomerAuthRequiredError) {
      redirect("/customer/login");
    }

    throw error;
  }

  const {
    context,
    activeClient,
    upcomingAppointments,
    pastAppointments,
  } = result;
  const { organizations, selectedOrganization } = context;

  if (organizations.length > 0 && !selectedOrganization) {
    redirect("/customer");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/customer"
              className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Müşteri paneline dön
            </Link>
            <div className="text-sm font-medium text-blue-400">Artexo</div>
            <h1 className="text-2xl font-semibold">Randevularım</h1>
          </div>
          <CustomerLogoutButton />
        </header>

        {organizations.length === 0 ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              Bu hesap herhangi bir işletmeye bağlı değil.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Randevularınızı görmek için işletme tarafından müşteri kaydınızın
              oluşturulması gerekir.
            </p>
          </section>
        ) : !activeClient ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">Aktif müşteri kaydı bulunamadı.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Randevularınızı görüntülemek için müşteri kaydınızın aktif olması
              gerekir.
            </p>
          </section>
        ) : (
          <div className="space-y-8">
            <AppointmentSection
              title="Yaklaşan Randevular"
              emptyMessage="Yaklaşan randevunuz bulunmuyor."
              appointments={upcomingAppointments}
            />
            <AppointmentSection
              title="Geçmiş Randevular"
              emptyMessage="Geçmiş randevunuz bulunmuyor."
              appointments={pastAppointments}
            />
          </div>
        )}
      </div>
    </main>
  );
}
