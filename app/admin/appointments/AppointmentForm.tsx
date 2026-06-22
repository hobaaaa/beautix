"use client";

import { Client, Service } from "../../../types";

type AppointmentFormValues = {
  client_id: string;
  appointment_type_id: string;
  date: string;
  start_time: string;
  notes: string;
};

export function AppointmentForm({
  clients,
  error,
  loading,
  onChange,
  onSubmit,
  services,
  values,
}: {
  clients: Client[];
  error: string | null;
  loading: boolean;
  onChange: (
    field: keyof AppointmentFormValues,
    value: AppointmentFormValues[keyof AppointmentFormValues],
  ) => void;
  onSubmit: () => void;
  services: Service[];
  values: AppointmentFormValues;
}) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Müşteri</label>
        <select
          value={values.client_id}
          onChange={(event) => onChange("client_id", event.target.value)}
          disabled={loading}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
        >
          <option value="">Müşteri seçin</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Hizmet</label>
        <select
          value={values.appointment_type_id}
          onChange={(event) =>
            onChange("appointment_type_id", event.target.value)
          }
          disabled={loading}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
        >
          <option value="">Hizmet seçin</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.duration_minutes} dk)
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Tarih</label>
          <input
            type="date"
            value={values.date}
            onChange={(event) => onChange("date", event.target.value)}
            disabled={loading}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Başlangıç saati
          </label>
          <input
            type="time"
            value={values.start_time}
            onChange={(event) => onChange("start_time", event.target.value)}
            disabled={loading}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Notlar</label>
        <textarea
          value={values.notes}
          onChange={(event) => onChange("notes", event.target.value)}
          disabled={loading}
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground disabled:opacity-50"
          placeholder="İsteğe bağlı notlar"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Oluşturuluyor..." : "Randevu Oluştur"}
        </button>
      </div>
    </div>
  );
}
