"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LifecycleStatus = "completed" | "no_show";

type AppointmentLifecycleActionsProps = {
  appointmentId: string;
};

type StatusResponse = {
  success?: boolean;
  error?: string;
};

const ACTIONS: Record<
  LifecycleStatus,
  {
    label: string;
    confirmText: string;
    successText: string;
  }
> = {
  completed: {
    label: "Tamamlandı",
    confirmText: "Bu randevuyu tamamlandı olarak işaretlemek istediğinize emin misiniz?",
    successText: "Randevu tamamlandı olarak işaretlendi.",
  },
  no_show: {
    label: "Gelmedi",
    confirmText: "Bu müşteriyi gelmedi olarak işaretlemek istediğinize emin misiniz?",
    successText: "Randevu gelmedi olarak işaretlendi.",
  },
};

export function AppointmentLifecycleActions({
  appointmentId,
}: AppointmentLifecycleActionsProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<LifecycleStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdateStatus() {
    if (!selectedStatus) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: selectedStatus }),
      });
      const result = (await response.json()) as StatusResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Randevu durumu güncellenemedi.");
      }

      setMessage(ACTIONS[selectedStatus].successText);
      setSelectedStatus(null);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Randevu durumu güncellenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-end gap-2">
        {(Object.keys(ACTIONS) as LifecycleStatus[]).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setSelectedStatus(status);
              setError(null);
              setMessage(null);
            }}
            disabled={loading}
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
          >
            {ACTIONS[status].label}
          </button>
        ))}
      </div>

      {message && <div className="text-xs text-green-600">{message}</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}

      {selectedStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl">
            <h3 className="text-lg font-semibold">Randevu durumu</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {ACTIONS[selectedStatus].confirmText}
            </p>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSelectedStatus(null)}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Güncelleniyor..." : ACTIONS[selectedStatus].label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
