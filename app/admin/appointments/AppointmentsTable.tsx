"use client";

import { AppointmentListItem, AppointmentStatus } from "../../../types";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-amber-100 text-amber-700",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

function formatTimeRange(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function truncateNotes(notes: string | null) {
  if (!notes) return "-";
  return notes.length > 80 ? `${notes.slice(0, 77)}...` : notes;
}

export function AppointmentsTable({
  appointments,
}: {
  appointments: AppointmentListItem[];
}) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
        No appointments found for this day.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="rounded-lg border p-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
        >
          <div className="min-w-36">
            <div className="text-sm text-muted-foreground">Time</div>
            <div className="font-medium">
              {formatTimeRange(appointment.start_at, appointment.end_at)}
            </div>
          </div>

          <div className="flex-1 grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Client</div>
              <div className="font-medium">{appointment.client.name}</div>
              <div className="text-sm text-muted-foreground">
                {appointment.client.phone || appointment.client.email || "-"}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Service</div>
              <div className="font-medium">{appointment.service.name}</div>
              <div className="text-sm text-muted-foreground">
                {appointment.service.duration_minutes} min
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[appointment.status]}`}
              >
                {STATUS_LABELS[appointment.status]}
              </span>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Notes</div>
              <div className="text-sm">{truncateNotes(appointment.notes)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
