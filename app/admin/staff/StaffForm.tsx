"use client";

import { Service } from "../../../types";

export type StaffFormValues = {
  name: string;
  appointment_type_ids: string[];
};

export function StaffForm({
  error,
  loading,
  onChange,
  onSubmit,
  onCancel,
  services,
  submitLabel,
  title,
  values,
}: {
  error: string | null;
  loading: boolean;
  onChange: (values: StaffFormValues) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  services: Service[];
  submitLabel: string;
  title: string;
  values: StaffFormValues;
}) {
  function toggleService(serviceId: string) {
    const nextIds = values.appointment_type_ids.includes(serviceId)
      ? values.appointment_type_ids.filter((id) => id !== serviceId)
      : [...values.appointment_type_ids, serviceId];

    onChange({
      ...values,
      appointment_type_ids: nextIds,
    });
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Personelin verebildiği hizmetleri seçin.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Personel adı</label>
        <input
          type="text"
          value={values.name}
          onChange={(event) =>
            onChange({
              ...values,
              name: event.target.value,
            })
          }
          disabled={loading}
          className="min-h-11 w-full rounded-md border px-3 py-2 disabled:opacity-50"
          placeholder="Örn. Ayşe"
        />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Verdiği hizmetler</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((service) => (
            <label
              key={service.id}
              className="flex min-h-11 items-start gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={values.appointment_type_ids.includes(service.id)}
                disabled={loading}
                onChange={() => toggleService(service.id)}
              />
              <span>
                <span className="block font-medium">{service.name}</span>
                <span className="block text-muted-foreground">
                  {service.duration_minutes} dk
                  {!service.is_active ? " - Pasif hizmet" : ""}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-11 rounded-md border px-4 py-2 text-sm disabled:opacity-50"
          >
            Vazgeç
          </button>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="min-h-11 rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : submitLabel}
        </button>
      </div>
    </div>
  );
}


