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
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
  no_show: "Gelmedi",
};

function formatTimeRange(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  const formatter = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function truncateNotes(notes: string | null) {
  if (!notes) return "-";
  return notes.length > 80 ? `${notes.slice(0, 77)}...` : notes;
}

export function AppointmentsTable({
  appointments,
  cancellingId,
  emptyMessage,
  onCancelAppointment,
  onEditAppointment,
  showDate,
}: {
  appointments: AppointmentListItem[];
  cancellingId: string | null;
  emptyMessage: string;
  onCancelAppointment: (id: string) => void;
  onEditAppointment: (appointment: AppointmentListItem) => void;
  showDate: boolean;
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
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-start md:justify-between"
        >
          <div className="min-w-36">
            <div className="text-sm text-muted-foreground">Saat</div>
            <div className="font-medium">
              {formatTimeRange(appointment.start_at, appointment.end_at)}
            </div>
            {showDate && (
              <div className="text-sm text-muted-foreground">
                {formatDateLabel(appointment.start_at)}
              </div>
            )}
          </div>

          <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Müşteri</div>
              <div className="font-medium">{appointment.client.name}</div>
              <div className="text-sm text-muted-foreground">
                {appointment.client.phone || appointment.client.email || "-"}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Hizmet</div>
              <div className="font-medium">{appointment.service.name}</div>
              <div className="text-sm text-muted-foreground">
                {appointment.service.duration_minutes} dk
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Personel</div>
              <div className="font-medium">{appointment.staff.name}</div>
              <div className="text-sm text-muted-foreground">
                {appointment.staff.is_active ? "Aktif" : "Pasif"}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Durum</div>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[appointment.status]}`}
              >
                {STATUS_LABELS[appointment.status]}
              </span>
            </div>

            <div className="xl:col-span-2">
              <div className="text-sm text-muted-foreground">Notlar</div>
              <div className="text-sm">{truncateNotes(appointment.notes)}</div>
            </div>
          </div>

          <div className="flex min-w-36 flex-wrap justify-end gap-2">
            {appointment.status !== "cancelled" && (
              <>
                <button
                  type="button"
                  onClick={() => onEditAppointment(appointment)}
                  className="rounded-md border bg-slate-900 px-3 py-2 text-sm"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => onCancelAppointment(appointment.id)}
                  disabled={cancellingId === appointment.id}
                  className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
                >
                  {cancellingId === appointment.id ? "İptal ediliyor..." : "İptal et"}
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
