"use client";

import type { AdminMessages } from "@/lib/i18n/admin";
import type { Locale } from "@/lib/i18n/constants";
import { AppointmentListItem, AppointmentStatus } from "../../../types";
import { AppointmentLifecycleActions } from "./AppointmentLifecycleActions";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-amber-100 text-amber-700",
};

function formatTimeRange(startAt: string, endAt: string, locale: Locale) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function formatDateLabel(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function truncateNotes(notes: string | null, emptyLabel: string) {
  if (!notes) return emptyLabel;
  return notes.length > 80 ? `${notes.slice(0, 77)}...` : notes;
}

export function AppointmentsTable({
  appointments,
  cancellingId,
  emptyMessage,
  onCancelAppointment,
  onEditAppointment,
  currentTimeMs,
  showDate,
  locale,
  messages,
}: {
  appointments: AppointmentListItem[];
  cancellingId: string | null;
  currentTimeMs: number;
  emptyMessage: string;
  onCancelAppointment: (id: string) => void;
  onEditAppointment: (appointment: AppointmentListItem) => void;
  showDate: boolean;
  locale: Locale;
  messages: AdminMessages["appointments"];
}) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => {
        const appointmentStart = new Date(appointment.start_at).getTime();
        const isFutureConfirmed =
          appointment.status === "confirmed" && appointmentStart > currentTimeMs;
        const isPastConfirmed =
          appointment.status === "confirmed" && appointmentStart <= currentTimeMs;

        return (
          <div
            key={appointment.id}
            className="flex min-w-0 flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-start md:justify-between"
          >
          <div className="min-w-0 md:min-w-36">
            <div className="text-sm text-muted-foreground">{messages.time}</div>
            <div className="font-medium">
              {formatTimeRange(appointment.start_at, appointment.end_at, locale)}
            </div>
            {showDate && (
              <div className="text-sm text-muted-foreground">
                {formatDateLabel(appointment.start_at, locale)}
              </div>
            )}
          </div>

          <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">{messages.client}</div>
              <div className="break-words font-medium">{appointment.client.name}</div>
              <div className="break-all text-sm text-muted-foreground">
                {appointment.client.phone || appointment.client.email || "-"}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">{messages.service}</div>
              <div className="break-words font-medium">{appointment.service.name}</div>
              <div className="text-sm text-muted-foreground">
                {messages.durationText(appointment.service.duration_minutes)}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">{messages.staff}</div>
              <div className="break-words font-medium">{appointment.staff.name}</div>
              <div className="text-sm text-muted-foreground">
                {appointment.staff.is_active ? messages.active : messages.inactive}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">{messages.status}</div>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[appointment.status]}`}
              >
                {messages.statusLabels[appointment.status]}
              </span>
            </div>

            <div className="xl:col-span-2">
              <div className="text-sm text-muted-foreground">{messages.notes}</div>
              <div className="break-words text-sm">
                {truncateNotes(appointment.notes, messages.noNotes)}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap gap-2 sm:justify-end md:min-w-36">
            {isFutureConfirmed && (
              <>
                <button
                  type="button"
                  onClick={() => onEditAppointment(appointment)}
                  className="min-h-11 flex-1 rounded-md border bg-slate-900 px-3 py-2 text-sm sm:flex-none"
                >
                  {messages.edit}
                </button>
                <button
                  type="button"
                  onClick={() => onCancelAppointment(appointment.id)}
                  disabled={cancellingId === appointment.id}
                  className="min-h-11 flex-1 rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-50 sm:flex-none"
                >
                  {cancellingId === appointment.id ? messages.cancelling : messages.cancel}
                </button>
              </>
            )}
            {isPastConfirmed && (
              <AppointmentLifecycleActions
                appointmentId={appointment.id}
                messages={messages.lifecycle}
              />
            )}
          </div>
          </div>
        );
      })}
    </div>
  );
}
