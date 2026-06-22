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
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="space-y-2">
        <label className="text-sm font-medium">Client</label>
        <select
          value={values.client_id}
          onChange={(event) => onChange("client_id", event.target.value)}
          disabled={loading}
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Service</label>
        <select
          value={values.appointment_type_id}
          onChange={(event) =>
            onChange("appointment_type_id", event.target.value)
          }
          disabled={loading}
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">Select a service</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.duration_minutes} min)
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <input
            type="date"
            value={values.date}
            onChange={(event) => onChange("date", event.target.value)}
            disabled={loading}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Start time</label>
          <input
            type="time"
            value={values.start_time}
            onChange={(event) => onChange("start_time", event.target.value)}
            disabled={loading}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <textarea
          value={values.notes}
          onChange={(event) => onChange("notes", event.target.value)}
          disabled={loading}
          rows={4}
          className="w-full rounded-md border px-3 py-2"
          placeholder="Optional notes"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create appointment"}
        </button>
      </div>
    </div>
  );
}
