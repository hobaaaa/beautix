import {
  getAdminHref,
  getAdminMessages,
  type AdminMessages,
} from "@/lib/i18n/admin";
import { isLocale, type Locale } from "@/lib/i18n/constants";
import { measureServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { ArrowLeft, CalendarDays, Clock, StickyNote, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { AppointmentStatus } from "../../../../../types";
import {
  getClientAppointments,
  type AdminClientAppointmentListItem,
} from "@/app/admin/clients/queries";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  confirmed: "bg-blue-500/15 text-blue-200",
  completed: "bg-emerald-500/15 text-emerald-200",
  cancelled: "bg-red-500/15 text-red-200",
  no_show: "bg-amber-500/15 text-amber-200",
};

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function formatTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function AppointmentCard({
  appointment,
  locale,
  messages,
}: {
  appointment: AdminClientAppointmentListItem;
  locale: Locale;
  messages: AdminMessages;
}) {
  const appointmentMessages = messages.appointments;

  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm text-muted-foreground">
            {appointmentMessages.service}
          </div>
          <h3 className="mt-1 text-xl font-semibold">{appointment.service.name}</h3>
        </div>
        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[appointment.status]}`}
        >
          {appointmentMessages.statusLabels[appointment.status]}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {appointmentMessages.date}
          </div>
          <div className="font-semibold">{formatDate(appointment.start_at, locale)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {appointmentMessages.time}
          </div>
          <div className="font-semibold">
            {formatTime(appointment.start_at, locale)} -{" "}
            {formatTime(appointment.end_at, locale)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <UserRound className="h-4 w-4" />
            {appointmentMessages.staff}
          </div>
          <div className="font-semibold">{appointment.staff.name}</div>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 text-muted-foreground">
            {appointmentMessages.duration}
          </div>
          <div className="font-semibold">
            {appointmentMessages.durationText(appointment.service.duration_minutes)}
          </div>
        </div>
        {appointment.notes && (
          <div className="rounded-2xl border border-border bg-background/60 p-4 sm:col-span-2">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <StickyNote className="h-4 w-4" />
              {appointmentMessages.notes}
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
  locale,
  messages,
}: {
  title: string;
  emptyMessage: string;
  appointments: AdminClientAppointmentListItem[];
  locale: Locale;
  messages: AdminMessages;
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
              locale={locale}
              messages={messages}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function LocalizedAdminClientAppointmentsPage({
  params,
}: {
  params: Promise<{
    locale: string;
    clientId: string;
  }>;
}) {
  const { locale: localeParam, clientId } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const messages = getAdminMessages(locale);
  const clientMessages = messages.clients;
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
          href={getAdminHref("/clients", locale)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {clientMessages.backToClients}
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{clientName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {clientMessages.appointmentDescription}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1">
              {data.client.is_active
                ? clientMessages.activeClient
                : clientMessages.inactiveClient}
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
        title={clientMessages.upcomingAppointments}
        emptyMessage={clientMessages.noUpcomingAppointments}
        appointments={data.upcomingAppointments}
        locale={locale}
        messages={messages}
      />
      <AppointmentSection
        title={clientMessages.pastAndCancelledAppointments}
        emptyMessage={clientMessages.noPastOrCancelledAppointments}
        appointments={data.pastAppointments}
        locale={locale}
        messages={messages}
      />
    </div>
  );
}
