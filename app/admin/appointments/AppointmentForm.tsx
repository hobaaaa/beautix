"use client";

import type { AvailableSlot } from "@/lib/slots/availability-engine";
import type { AdminMessages } from "@/lib/i18n/admin";
import { Client, Service, StaffListItem } from "../../../types";

export type AppointmentFormValues = {
  client_id: string;
  appointment_type_id: string;
  staff_id: string;
  date: string;
  selected_slot_start: string;
  notes: string;
};

export function AppointmentForm({
  availableSlots,
  clients,
  error,
  loading,
  loadingSlots,
  onChange,
  onSubmit,
  services,
  slotError,
  staffMembers,
  submitLabel,
  values,
  messages,
}: {
  availableSlots: AvailableSlot[];
  clients: Client[];
  error: string | null;
  loading: boolean;
  loadingSlots: boolean;
  onChange: (
    field: keyof AppointmentFormValues,
    value: AppointmentFormValues[keyof AppointmentFormValues],
  ) => void;
  onSubmit: () => void;
  services: Service[];
  slotError: string | null;
  staffMembers: StaffListItem[];
  submitLabel: string;
  values: AppointmentFormValues;
  messages: AdminMessages["appointments"];
}) {
  const eligibleStaff = staffMembers.filter((staffMember) =>
    staffMember.appointment_types.some(
      (service) => service.id === values.appointment_type_id,
    ),
  );

  const shouldShowStaffSelect =
    values.appointment_type_id && eligibleStaff.length > 1;
  const canLoadSlots = Boolean(
    values.date && values.appointment_type_id && values.staff_id,
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{messages.client}</label>
        <select
          value={values.client_id}
          onChange={(event) => onChange("client_id", event.target.value)}
          disabled={loading}
          className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
        >
          <option value="">{messages.selectClient}</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{messages.service}</label>
        <select
          value={values.appointment_type_id}
          onChange={(event) =>
            onChange("appointment_type_id", event.target.value)
          }
          disabled={loading}
          className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
        >
          <option value="">{messages.selectService}</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({messages.durationText(service.duration_minutes)})
            </option>
          ))}
        </select>
      </div>

      {shouldShowStaffSelect ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {messages.staff}
          </label>
          <select
            value={values.staff_id}
            onChange={(event) => onChange("staff_id", event.target.value)}
            disabled={loading}
            className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
          >
            <option value="">{messages.selectStaff}</option>
            {eligibleStaff.map((staffMember) => (
              <option key={staffMember.id} value={staffMember.id}>
                {staffMember.name}
              </option>
            ))}
          </select>
        </div>
      ) : values.appointment_type_id ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {messages.staff}
          </label>
          <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
            {eligibleStaff.length === 1
              ? messages.autoSelectedStaff(eligibleStaff[0].name)
              : messages.noEligibleStaff}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{messages.date}</label>
        <input
          type="date"
          value={values.date}
          onChange={(event) => onChange("date", event.target.value)}
          disabled={loading}
          min={new Intl.DateTimeFormat("en-CA", {
            timeZone: "Europe/Istanbul",
          }).format(new Date())}
          className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {messages.availableSlots}
        </label>

        {!canLoadSlots ? (
          <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
            {messages.selectRequiredForSlots}
          </div>
        ) : loadingSlots ? (
          <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
            {messages.loadingSlots}
          </div>
        ) : slotError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-4 text-sm text-red-700">
            {slotError}
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
            {messages.noSlots}
          </div>
        ) : (
          <div className="dark-scrollbar max-h-72 overflow-y-auto rounded-md border border-border p-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {availableSlots.map((slot) => {
                const isSelected = values.selected_slot_start === slot.start_at;

                return (
                  <button
                    key={slot.start_at}
                    type="button"
                    onClick={() =>
                      onChange("selected_slot_start", slot.start_at)
                    }
                    disabled={loading}
                    className={`min-h-11 rounded-md border px-3 py-2 text-sm transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    } disabled:opacity-50`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{messages.notes}</label>
        <textarea
          value={values.notes}
          onChange={(event) => onChange("notes", event.target.value)}
          disabled={loading}
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground disabled:opacity-50"
          placeholder={messages.optionalNotes}
        />
      </div>

      <div className="flex justify-end gap-2 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="min-h-11 w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50 sm:w-auto"
        >
          {loading ? messages.saving : submitLabel}
        </button>
      </div>
    </div>
  );
}

