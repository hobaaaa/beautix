"use client";

import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import { useEffect, useMemo, useState } from "react";
import type { AvailableSlot } from "@/lib/slots/availability-engine";
import type { AdminMessages } from "@/lib/i18n/admin";
import {
  AppointmentListItem,
  Client,
  Service,
  StaffListItem,
} from "../../../types";
import { AppointmentForm, AppointmentFormValues } from "./AppointmentForm";

function formatDateForInput(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
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
      selected_slot_start: appointment.start_at,
      notes: appointment.notes ?? "",
    };
  }

  return {
    client_id: "",
    appointment_type_id: "",
    staff_id: "",
    date: defaultDate,
    selected_slot_start: "",
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
    staffMember.appointment_types.some(
      (service) => service.id === appointmentTypeId,
    ),
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
  messages,
}: {
  appointment: AppointmentListItem | null;
  clients: Client[];
  defaultDate: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (mode: "create" | "edit") => void;
  services: Service[];
  staffMembers: StaffListItem[];
  messages: AdminMessages["appointments"];
}) {
  const mode = appointment ? "edit" : "create";
  const [values, setValues] = useState<AppointmentFormValues>(
    getInitialValues(defaultDate, appointment),
  );
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);

  useEffect(() => {
    if (isOpen) {
      setValues(getInitialValues(defaultDate, appointment));
      setError(null);
      setSlotError(null);
      setLoading(false);
      setLoadingSlots(false);
      setAvailableSlots([]);
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

      if (
        eligibleStaff.some((staffMember) => staffMember.id === current.staff_id)
      ) {
        return current;
      }

      return current.staff_id ? { ...current, staff_id: "" } : current;
    });
  }, [eligibleStaff, values.appointment_type_id]);

  useEffect(() => {
    if (
      !isOpen ||
      !values.date ||
      !values.appointment_type_id ||
      !values.staff_id
    ) {
      setAvailableSlots([]);
      setLoadingSlots(false);
      setSlotError(null);
      return;
    }

    let isCancelled = false;
    const searchParams = new URLSearchParams({
      date: values.date,
      appointmentTypeId: values.appointment_type_id,
      staffId: values.staff_id,
    });

    if (appointment?.id) {
      searchParams.set("excludeAppointmentId", appointment.id);
    }

    async function loadSlots() {
      setLoadingSlots(true);
      setSlotError(null);

      try {
        const response = await fetch(
          `/api/admin/appointments/available-slots?${searchParams.toString()}`,
        );
        if (!response.ok) {
          throw new Error(
            await readApiErrorMessage(response, messages.loadSlotsFailed),
          );
        }

        const json = (await response.json()) as { data?: AvailableSlot[] };
        if (isCancelled) {
          return;
        }

        const slots = (json.data ?? []) as AvailableSlot[];
        setAvailableSlots(slots);

        setValues((current) => {
          if (
            slots.some((slot) => slot.start_at === current.selected_slot_start)
          ) {
            return current;
          }

          return { ...current, selected_slot_start: "" };
        });
      } catch (slotLoadError) {
        if (isCancelled) {
          return;
        }

        setAvailableSlots([]);
        setValues((current) => ({ ...current, selected_slot_start: "" }));
        setSlotError(
          getClientErrorMessage(slotLoadError, messages.loadSlotsFailed),
        );
      } finally {
        if (!isCancelled) {
          setLoadingSlots(false);
        }
      }
    }

    loadSlots();

    return () => {
      isCancelled = true;
    };
  }, [
    appointment?.id,
    isOpen,
    messages.loadSlotsFailed,
    values.appointment_type_id,
    values.date,
    values.staff_id,
  ]);

  function updateField(
    field: keyof AppointmentFormValues,
    value: AppointmentFormValues[keyof AppointmentFormValues],
  ) {
    setValues((current) => {
      const nextValues = {
        ...current,
        [field]: value,
      };

      if (field === "appointment_type_id") {
        nextValues.staff_id = "";
        nextValues.selected_slot_start = "";
      }

      if (field === "staff_id" || field === "date") {
        nextValues.selected_slot_start = "";
      }

      return nextValues;
    });
  }

  async function handleSubmit() {
    if (!values.client_id) {
      setError(messages.clientRequired);
      return;
    }

    if (!values.appointment_type_id) {
      setError(messages.serviceRequired);
      return;
    }

    if (!values.staff_id) {
      setError(messages.staffRequired);
      return;
    }

    if (!values.date) {
      setError(messages.dateRequired);
      return;
    }

    if (!values.selected_slot_start) {
      setError(messages.slotRequired);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        mode === "edit"
          ? `/api/admin/appointments/${appointment!.id}`
          : "/api/admin/appointments",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: values.client_id,
            appointment_type_id: values.appointment_type_id,
            staff_id: values.staff_id,
            selected_slot_start: values.selected_slot_start,
            notes: values.notes,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            mode === "edit"
              ? messages.updateFailed
              : messages.createFailed,
          ),
        );
      }

      onSuccess(mode);
    } catch (submitError) {
      setError(
        getClientErrorMessage(
          submitError,
          mode === "edit" ? messages.updateFailed : messages.createFailed,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] dark-scrollbar sm:p-4">
      <div className="max-h-[calc(100dvh_-_2rem_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              {mode === "edit" ? messages.editTitle : messages.createTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "edit"
                ? messages.editDescription
                : messages.createDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="min-h-11 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
          >
            {messages.close}
          </button>
        </div>

        <AppointmentForm
          availableSlots={availableSlots}
          clients={clients}
          error={error}
          loading={loading}
          loadingSlots={loadingSlots}
          onChange={updateField}
          onSubmit={handleSubmit}
          services={services}
          slotError={slotError}
          staffMembers={staffMembers}
          submitLabel={
            mode === "edit" ? messages.updateSubmit : messages.createSubmit
          }
          values={values}
          messages={messages}
        />
      </div>
    </div>
  );
}

