import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { ArrowLeft, CalendarDays, Clock, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { AppointmentStatus } from "../../../types";
import { CustomerLogoutButton } from "../CustomerLogoutButton";
import type { Locale } from "@/lib/i18n/constants";
import {
  getCustomerHref,
  getCustomerMessages,
  type CustomerMessages,
} from "@/lib/i18n/customer";
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

function formatDate(value: string, locale?: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function formatTime(value: string, locale?: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
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
  localePrefix,
  messages,
  cancelMessages,
}: {
  appointment: CustomerAppointmentListItem;
  localePrefix?: Locale;
  messages: CustomerMessages;
  cancelMessages: Parameters<typeof CancelAppointmentButton>[0]["messages"];
}) {
  const canCancel = canCancelAppointment(appointment);

  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{messages.service}</div>
          <h3 className="mt-1 break-words text-xl font-semibold">{appointment.service.name}</h3>
        </div>
        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[appointment.status]}`}
        >
          {messages.statusLabels[appointment.status]}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {messages.date}
          </div>
          <div className="font-semibold">
            {formatDate(appointment.start_at, localePrefix)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {messages.time}
          </div>
          <div className="font-semibold">
            {formatTime(appointment.start_at, localePrefix)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <UserRound className="h-4 w-4" />
            {messages.staff}
          </div>
          <div className="break-words font-semibold">{appointment.staff.name}</div>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 text-muted-foreground">{messages.duration}</div>
          <div className="font-semibold">
            {appointment.service.duration_minutes} {messages.minuteShort}
          </div>
        </div>
      </div>

      {canCancel && (
        <div className="mt-5 flex justify-end">
          <CancelAppointmentButton
            appointmentId={appointment.id}
            messages={cancelMessages}
          />
        </div>
      )}
    </article>
  );
}

function AppointmentSection({
  title,
  emptyMessage,
  appointments,
  localePrefix,
  messages,
  cancelMessages,
}: {
  title: string;
  emptyMessage: string;
  appointments: CustomerAppointmentListItem[];
  localePrefix?: Locale;
  messages: CustomerMessages;
  cancelMessages: Parameters<typeof CancelAppointmentButton>[0]["messages"];
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
              localePrefix={localePrefix}
              messages={messages}
              cancelMessages={cancelMessages}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export async function CustomerAppointmentsPageContent({
  localePrefix,
}: {
  localePrefix?: Locale;
}) {
  const t = getCustomerMessages(localePrefix);
  const logoutMessages = {
    logout: t.logout,
    loggingOut: t.loggingOut,
    logoutFailed: t.logoutFailed,
  };
  const cancelMessages = {
    cancelAppointment: t.cancelAppointment,
    cancelDialogTitle: t.cancelDialogTitle,
    cancelDialogDescription: t.cancelDialogDescription,
    cancelKeep: t.cancelKeep,
    cancelConfirm: t.cancelConfirm,
    cancelling: t.cancelling,
    cancelSuccess: t.cancelSuccess,
    cancelFailed: t.cancelFailed,
  };
  let result;

  try {
    result = await getCustomerAppointments();
  } catch (error) {
    if (error instanceof CustomerAuthRequiredError) {
      redirect(getCustomerHref("/login", localePrefix));
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
    redirect(getCustomerHref("", localePrefix));
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={getCustomerHref("", localePrefix)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.backToPanel}
            </Link>
            <CustomerLogoutButton
              localePrefix={localePrefix}
              messages={logoutMessages}
            />
          </div>
          <div className="flex justify-center">
            <ArtexoBrand />
          </div>
          <h1 className="text-2xl font-semibold">{t.appointmentsTitle}</h1>
        </header>

        {organizations.length === 0 ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              {t.noOrganizationTitle}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.noOrganizationDescription}
            </p>
          </section>
        ) : !activeClient ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              {t.activeClientNotFoundTitle}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.activeClientNotFoundDescription}
            </p>
          </section>
        ) : (
          <div className="space-y-8">
            <AppointmentSection
              title={t.upcomingAppointments}
              emptyMessage={t.noUpcomingAppointments}
              appointments={upcomingAppointments}
              localePrefix={localePrefix}
              messages={t}
              cancelMessages={cancelMessages}
            />
            <AppointmentSection
              title={t.pastAndCancelledAppointments}
              emptyMessage={t.noPastOrCancelledAppointments}
              appointments={pastAppointments}
              localePrefix={localePrefix}
              messages={t}
              cancelMessages={cancelMessages}
            />
          </div>
        )}
      </div>
    </main>
  );
}

export default async function CustomerAppointmentsPage() {
  return <CustomerAppointmentsPageContent />;
}



