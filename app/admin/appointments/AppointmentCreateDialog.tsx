"use client";

import { useEffect, useState } from "react";
import { Client, Service } from "../../../types";
import { AppointmentForm } from "./AppointmentForm";

type AppointmentFormValues = {
  client_id: string;
  appointment_type_id: string;
  date: string;
  start_time: string;
  notes: string;
};

function getInitialValues(defaultDate: string): AppointmentFormValues {
  return {
    client_id: "",
    appointment_type_id: "",
    date: defaultDate,
    start_time: "",
    notes: "",
  };
}

export function AppointmentCreateDialog({
  clients,
  defaultDate,
  isOpen,
  onClose,
  onSuccess,
  services,
}: {
  clients: Client[];
  defaultDate: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  services: Service[];
}) {
  const [values, setValues] = useState<AppointmentFormValues>(
    getInitialValues(defaultDate),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(getInitialValues(defaultDate));
      setError(null);
      setLoading(false);
    }
  }, [defaultDate, isOpen]);

  function updateField(
    field: keyof AppointmentFormValues,
    value: AppointmentFormValues[keyof AppointmentFormValues],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit() {
    if (!values.client_id) {
      setError("Müşteri seçimi zorunludur.");
      return;
    }

    if (!values.appointment_type_id) {
      setError("Hizmet seçimi zorunludur.");
      return;
    }

    if (!values.date) {
      setError("Tarih zorunludur.");
      return;
    }

    if (!values.start_time) {
      setError("Başlangıç saati zorunludur.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Randevu oluşturulamadı.");
      }

      onSuccess();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Randevu oluşturulamadı.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Randevu Ekle</h2>
            <p className="text-sm text-muted-foreground">
              Seçili tarih için manuel olarak randevu oluşturun.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground disabled:opacity-50"
          >
            Kapat
          </button>
        </div>

        <AppointmentForm
          clients={clients}
          error={error}
          loading={loading}
          onChange={updateField}
          onSubmit={handleSubmit}
          services={services}
          values={values}
        />
      </div>
    </div>
  );
}
