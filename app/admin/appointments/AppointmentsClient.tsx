"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AppointmentListItem,
  Client,
  Message,
  Service,
  StaffListItem,
} from "../../../types";
import { AppointmentCreateDialog } from "./AppointmentCreateDialog";
import { AppointmentsTable } from "./AppointmentsTable";

function addDays(date: string, amount: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + amount));
  return value.toISOString().slice(0, 10);
}

export function AppointmentsClient({
  appointments,
  clients,
  services,
  staffMembers,
  serviceFilters,
  staffFilters,
  selectedDate,
  selectedAppointmentTypeId,
  selectedStaffId,
}: {
  appointments: AppointmentListItem[];
  clients: Client[];
  services: Service[];
  staffMembers: StaffListItem[];
  serviceFilters: Service[];
  staffFilters: StaffListItem[];
  selectedDate: string;
  selectedAppointmentTypeId: string;
  selectedStaffId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentListItem | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const tomorrow = useMemo(() => addDays(selectedDate, 1), [selectedDate]);

  function updateFilters(nextValues: {
    date?: string;
    appointmentTypeId?: string;
    staffId?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(nextValues)) {
      if (typeof value === "string" && value.trim()) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function openCreateDialog() {
    setEditingAppointment(null);
    setIsDialogOpen(true);
    setMessage(null);
  }

  function openEditDialog(appointment: AppointmentListItem) {
    setEditingAppointment(appointment);
    setIsDialogOpen(true);
    setMessage(null);
  }

  async function handleCancelAppointment(id: string) {
    setMessage(null);
    setCancellingId(id);

    try {
      const response = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Randevu iptal edilemedi.");
      }

      setMessage({ type: "success", text: "Randevu iptal edildi." });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Randevu iptal edilemedi.",
      });
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Randevular</h1>
          <p className="text-sm text-muted-foreground">
            Seçilen tarihe ait günlük randevu listesi.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap sm:justify-end">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                updateFilters({
                  date: new Intl.DateTimeFormat("en-CA", {
                    timeZone: "Europe/Istanbul",
                  }).format(new Date()),
                })
              }
              className="rounded-md border px-3 py-2 text-sm bg-slate-900"
            >
              Bugün
            </button>
            <button
              type="button"
              onClick={() => updateFilters({ date: tomorrow })}
              className="rounded-md border px-3 py-2 text-sm bg-slate-900"
            >
              Yarın
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => updateFilters({ date: event.target.value })}
            className="rounded-md border px-3 py-2 text-sm bg-slate-900"
          />

          <select
            value={selectedAppointmentTypeId}
            onChange={(event) =>
              updateFilters({
                appointmentTypeId: event.target.value || undefined,
              })
            }
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            <option value="">Tüm hizmetler</option>
            {serviceFilters.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStaffId}
            onChange={(event) =>
              updateFilters({ staffId: event.target.value || undefined })
            }
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            <option value="">Tüm personeller</option>
            {staffFilters.map((staffMember) => (
              <option key={staffMember.id} value={staffMember.id}>
                {staffMember.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openCreateDialog}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white sm:ml-auto"
          >
            Randevu Ekle
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}
        >
          {message.text}
        </div>
      )}

      <AppointmentCreateDialog
        appointment={editingAppointment}
        clients={clients}
        defaultDate={selectedDate}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingAppointment(null);
        }}
        onSuccess={(mode) => {
          setIsDialogOpen(false);
          setEditingAppointment(null);
          setMessage({
            type: "success",
            text:
              mode === "edit" ? "Randevu güncellendi." : "Randevu oluşturuldu.",
          });
          router.refresh();
        }}
        services={services}
        staffMembers={staffMembers}
      />

      <AppointmentsTable
        appointments={appointments}
        cancellingId={cancellingId}
        onCancelAppointment={handleCancelAppointment}
        onEditAppointment={openEditDialog}
      />
    </div>
  );
}
