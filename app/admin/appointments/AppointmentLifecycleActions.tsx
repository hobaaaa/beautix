"use client";

import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import type { AdminMessages } from "@/lib/i18n/admin";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LifecycleStatus = "completed" | "no_show";

type AppointmentLifecycleActionsProps = {
  appointmentId: string;
  messages: AdminMessages["appointments"]["lifecycle"];
};

const ACTIONS: Record<
  LifecycleStatus,
  {
    labelKey: "completed" | "noShow";
    confirmKey: "completedConfirm" | "noShowConfirm";
    successKey: "completedSuccess" | "noShowSuccess";
  }
> = {
  completed: {
    labelKey: "completed",
    confirmKey: "completedConfirm",
    successKey: "completedSuccess",
  },
  no_show: {
    labelKey: "noShow",
    confirmKey: "noShowConfirm",
    successKey: "noShowSuccess",
  },
};

export function AppointmentLifecycleActions({
  appointmentId,
  messages,
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

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, messages.failed),
        );
      }

      setMessage(messages[ACTIONS[selectedStatus].successKey]);
      setSelectedStatus(null);
      router.refresh();
    } catch (error) {
      setError(
        getClientErrorMessage(error, messages.failed),
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
            {messages[ACTIONS[status].labelKey]}
          </button>
        ))}
      </div>

      {message && <div className="text-xs text-green-600">{message}</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}

      {selectedStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 py-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-h-[calc(100dvh_-_2rem_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] w-full max-w-sm overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl">
            <h3 className="text-lg font-semibold">{messages.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {messages[ACTIONS[selectedStatus].confirmKey]}
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
                {messages.dismiss}
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? messages.updating : messages[ACTIONS[selectedStatus].labelKey]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


