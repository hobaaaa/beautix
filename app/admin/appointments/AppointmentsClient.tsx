"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppointmentListItem, Client, Service } from "../../../types";
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
  selectedDate,
}: {
  appointments: AppointmentListItem[];
  clients: Client[];
  services: Service[];
  selectedDate: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const tomorrow = useMemo(() => addDays(selectedDate, 1), [selectedDate]);

  function updateDate(date: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", date);
    router.push(`${pathname}?${params.toString()}`);
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                updateDate(
                  new Intl.DateTimeFormat("en-CA", {
                    timeZone: "Europe/Istanbul",
                  }).format(new Date()),
                )
              }
              className="rounded-md border px-3 py-2 text-sm"
            >
              Bugün
            </button>
            <button
              type="button"
              onClick={() => updateDate(tomorrow)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              Yarın
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => updateDate(event.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white"
          >
            Randevu Ekle
          </button>
        </div>
      </div>

      <AppointmentCreateDialog
        clients={clients}
        defaultDate={selectedDate}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          router.refresh();
        }}
        services={services}
      />

      <AppointmentsTable appointments={appointments} />
    </div>
  );
}
