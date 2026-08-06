"use client";

import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import { getAdminMessages, type AdminMessages } from "@/lib/i18n/admin";
import { defaultLocale, type Locale } from "@/lib/i18n/constants";
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
import type { AppointmentListView } from "./queries";

function addDays(date: string, amount: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + amount));
  return value.toISOString().slice(0, 10);
}

export function AppointmentsClient({
  appointments,
  clients,
  currentPage,
  hasMore,
  selectedView,
  services,
  staffMembers,
  serviceFilters,
  staffFilters,
  selectedDate,
  selectedAppointmentTypeId,
  selectedStaffId,
  locale = defaultLocale,
  messages = getAdminMessages(locale).appointments,
}: {
  appointments: AppointmentListItem[];
  clients: Client[];
  currentPage: number;
  hasMore: boolean;
  selectedView: AppointmentListView;
  services: Service[];
  staffMembers: StaffListItem[];
  serviceFilters: Service[];
  staffFilters: StaffListItem[];
  selectedDate: string;
  selectedAppointmentTypeId: string;
  selectedStaffId: string;
  locale?: Locale;
  messages?: AdminMessages["appointments"];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentListItem | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [currentTimeMs] = useState(() => Date.now());

  const tomorrow = useMemo(() => addDays(selectedDate, 1), [selectedDate]);

  function updateFilters(nextValues: {
    date?: string;
    appointmentTypeId?: string;
    staffId?: string;
    view?: AppointmentListView;
    page?: string;
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

  function showDaily(date: string) {
    updateFilters({ date, view: "day", page: undefined });
  }

  function showAllAppointments() {
    updateFilters({ view: "all", page: "1" });
  }

  function loadMore() {
    updateFilters({ view: "all", page: String(currentPage + 1) });
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

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, messages.cancelFailed),
        );
      }

      setMessage({ type: "success", text: messages.cancelSuccess });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: getClientErrorMessage(error, messages.cancelFailed),
      });
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{messages.title}</h1>
          <p className="text-sm text-muted-foreground">
            {selectedView === "all"
              ? messages.allDescription
              : messages.dayDescription}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateDialog}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white sm:ml-auto"
        >
          {messages.add}
        </button>
      </div>
      <div className="flex min-w-0 flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-end md:justify-between">
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() =>
              showDaily(
                new Intl.DateTimeFormat("en-CA", {
                  timeZone: "Europe/Istanbul",
                }).format(new Date()),
              )
            }
            className={`min-w-0 rounded-md border px-3 py-2 text-sm ${
              selectedView === "day" ? "bg-slate-900" : "bg-background"
            }`}
          >
            {messages.today}
          </button>
          <button
            type="button"
            onClick={() => showDaily(tomorrow)}
            className="min-w-0 rounded-md border bg-slate-900 px-3 py-2 text-sm"
          >
            {messages.tomorrow}
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => showDaily(event.target.value)}
            className="col-span-2 min-w-0 rounded-md border bg-slate-900 px-3 py-2 text-sm sm:col-auto"
          />
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={showAllAppointments}
            className="w-full min-w-0 rounded-md border bg-slate-900 px-3 py-2 text-sm"
          >
            {messages.allAppointments}
          </button>

          <select
            value={selectedAppointmentTypeId}
            onChange={(event) =>
              updateFilters({
                appointmentTypeId: event.target.value || undefined,
                page: selectedView === "all" ? "1" : undefined,
              })
            }
            className="w-full min-w-0 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            <option value="">{messages.allServices}</option>
            {serviceFilters.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStaffId}
            onChange={(event) =>
              updateFilters({
                staffId: event.target.value || undefined,
                page: selectedView === "all" ? "1" : undefined,
              })
            }
            className="w-full min-w-0 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            <option value="">{messages.allStaff}</option>
            {staffFilters.map((staffMember) => (
              <option key={staffMember.id} value={staffMember.id}>
                {staffMember.name}
              </option>
            ))}
          </select>
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
              mode === "edit" ? messages.updateSuccess : messages.createSuccess,
          });
          router.refresh();
        }}
        services={services}
        staffMembers={staffMembers}
        messages={messages}
      />

      <AppointmentsTable
        appointments={appointments}
        cancellingId={cancellingId}
        currentTimeMs={currentTimeMs}
        onCancelAppointment={handleCancelAppointment}
        onEditAppointment={openEditDialog}
        showDate={selectedView === "all"}
        emptyMessage={
          selectedView === "all"
            ? messages.emptyAll
            : messages.emptyDay
        }
        locale={locale}
        messages={messages}
      />

      {selectedView === "all" && hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            className="rounded-md border px-4 py-2 text-sm"
          >
            {messages.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}
