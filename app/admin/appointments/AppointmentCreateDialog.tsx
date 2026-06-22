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
      setError("Client is required.");
      return;
    }

    if (!values.appointment_type_id) {
      setError("Service is required.");
      return;
    }

    if (!values.date) {
      setError("Date is required.");
      return;
    }

    if (!values.start_time) {
      setError("Start time is required.");
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
        throw new Error(json.error || "Failed to create appointment");
      }

      onSuccess();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create appointment",
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
      <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Add appointment</h2>
            <p className="text-sm text-muted-foreground">
              Create a manual appointment for the selected day.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border px-3 py-1 text-sm"
          >
            Close
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
