import { measureServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { ArrowLeft, CalendarDays, Clock, StickyNote, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { AppointmentStatus } from "../../../../types";
import {
  getClientAppointments,
  type AdminClientAppointmentListItem,
} from "../queries";

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

function AppointmentCard({
  appointment,
}: {
  appointment: AdminClientAppointmentListItem;
}) {
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
          <div className="font-semibold">
            {formatTime(appointment.start_at)} - {formatTime(appointment.end_at)}
          </div>
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
        {appointment.notes && (
          <div className="rounded-2xl border border-border bg-background/60 p-4 sm:col-span-2">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <StickyNote className="h-4 w-4" />
              Not
            </div>
            <div className="text-sm leading-6">{appointment.notes}</div>
          </div>
        )}
      </div>
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
  appointments: AdminClientAppointmentListItem[];
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

export default async function AdminClientAppointmentsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const data = await measureServerTiming(
    "admin-client-appointments-page",
    "page.total",
    async () => {
      const context = await getCurrentOrgContext("admin-client-appointments-page");
      return getClientAppointments(clientId, context, "admin-client-appointments-page");
    },
    (result) => ({
      found: Boolean(result.client),
      upcomingCount: result.upcomingAppointments.length,
      pastCount: result.pastAppointments.length,
    }),
  );

  if (!data.client) {
    notFound();
  }

  const clientName = `${data.client.first_name} ${data.client.last_name}`.trim();

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Müşterilere dön
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{clientName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bu müşteriye ait randevu kayıtları.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1">
              {data.client.is_active ? "Aktif müşteri" : "Pasif müşteri"}
            </span>
            {data.client.email && (
              <span className="rounded-full border border-border px-3 py-1">
                {data.client.email}
              </span>
            )}
            {data.client.phone && (
              <span className="rounded-full border border-border px-3 py-1">
                {data.client.phone}
              </span>
            )}
          </div>
        </div>
      </header>

      <AppointmentSection
        title="Yaklaşan Randevular"
        emptyMessage="Bu müşteri için yaklaşan randevu bulunmuyor."
        appointments={data.upcomingAppointments}
      />
      <AppointmentSection
        title="Geçmiş Randevular"
        emptyMessage="Bu müşteri için geçmiş randevu bulunmuyor."
        appointments={data.pastAppointments}
      />
    </div>
  );
}

