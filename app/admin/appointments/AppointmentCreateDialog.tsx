"use client";

import { useEffect, useMemo, useState } from "react";
import { AppointmentListItem, Client, Service, StaffListItem } from "../../../types";
import { AppointmentForm } from "./AppointmentForm";

type AppointmentFormValues = {
  client_id: string;
  appointment_type_id: string;
  staff_id: string;
  date: string;
  start_time: string;
  notes: string;
};

function formatDateForInput(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function formatTimeForInput(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function getInitialValues(
  defaultDate: string,
  appointment: AppointmentListItem | null,
): AppointmentFormValues {
  if (appointment) {
    return {
      client_id: appointment.client_id,
      appointment_type_id: appointment.appointment_type_id,
      staff_id: appointment.staff_id,
      date: formatDateForInput(appointment.start_at),
      start_time: formatTimeForInput(appointment.start_at),
      notes: appointment.notes ?? "",
    };
  }

  return {
    client_id: "",
    appointment_type_id: "",
    staff_id: "",
    date: defaultDate,
    start_time: "",
    notes: "",
  };
}

function getEligibleStaff(
  staffMembers: StaffListItem[],
  appointmentTypeId: string,
) {
  if (!appointmentTypeId) {
    return [];
  }

  return staffMembers.filter((staffMember) =>
    staffMember.appointment_types.some((service) => service.id === appointmentTypeId),
  );
}

export function AppointmentCreateDialog({
  appointment,
  clients,
  defaultDate,
  isOpen,
  onClose,
  onSuccess,
  services,
  staffMembers,
}: {
  appointment: AppointmentListItem | null;
  clients: Client[];
  defaultDate: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (mode: "create" | "edit") => void;
  services: Service[];
  staffMembers: StaffListItem[];
}) {
  const mode = appointment ? "edit" : "create";
  const [values, setValues] = useState<AppointmentFormValues>(
    getInitialValues(defaultDate, appointment),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(getInitialValues(defaultDate, appointment));
      setError(null);
      setLoading(false);
    }
  }, [appointment, defaultDate, isOpen]);

  const eligibleStaff = useMemo(
    () => getEligibleStaff(staffMembers, values.appointment_type_id),
    [staffMembers, values.appointment_type_id],
  );

  useEffect(() => {
    setValues((current) => {
      if (!current.appointment_type_id) {
        return current.staff_id ? { ...current, staff_id: "" } : current;
      }

      if (eligibleStaff.length === 1) {
        return current.staff_id === eligibleStaff[0].id
          ? current
          : { ...current, staff_id: eligibleStaff[0].id };
      }

      if (eligibleStaff.some((staffMember) => staffMember.id === current.staff_id)) {
        return current;
      }

      return current.staff_id ? { ...current, staff_id: "" } : current;
    });
  }, [eligibleStaff, values.appointment_type_id]);

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

    if (!values.staff_id) {
      setError("Personel seçimi zorunludur.");
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
      const response = await fetch(
        mode === "edit" ? `/api/admin/appointments/${appointment!.id}` : "/api/admin/appointments",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        },
      );

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(
          json.error ||
            (mode === "edit" ? "Randevu güncellenemedi." : "Randevu oluşturulamadı."),
        );
      }

      onSuccess(mode);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : mode === "edit"
            ? "Randevu güncellenemedi."
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
            <h2 className="text-xl font-semibold">
              {mode === "edit" ? "Randevuyu Düzenle" : "Randevu Ekle"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "edit"
                ? "Seçili randevu bilgilerini güncelleyin."
                : "Seçili tarih için manuel olarak randevu oluşturun."}
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
          staffMembers={staffMembers}
          submitLabel={mode === "edit" ? "Randevuyu Güncelle" : "Randevu Oluştur"}
          values={values}
        />
      </div>
    </div>
  );
}