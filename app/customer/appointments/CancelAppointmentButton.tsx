"use client";

import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import type { CustomerMessages } from "@/lib/i18n/customer";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CancelAppointmentButtonProps = {
  appointmentId: string;
  messages?: Pick<
    CustomerMessages,
    | "cancelAppointment"
    | "cancelDialogTitle"
    | "cancelDialogDescription"
    | "cancelKeep"
    | "cancelConfirm"
    | "cancelling"
    | "cancelSuccess"
    | "cancelFailed"
  >;
};

export function CancelAppointmentButton({
  appointmentId,
  messages,
}: CancelAppointmentButtonProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const labels = messages ?? {
    cancelAppointment: "İptal Et",
    cancelDialogTitle: "Randevu iptali",
    cancelDialogDescription:
      "Bu randevuyu iptal etmek istediğinize emin misiniz?",
    cancelKeep: "Vazgeç",
    cancelConfirm: "Randevuyu İptal Et",
    cancelling: "İptal ediliyor...",
    cancelSuccess: "Randevu iptal edildi.",
    cancelFailed: "Randevu iptal edilemedi.",
  };

  async function handleCancel() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/customer/appointments/${appointmentId}/cancel`,
        {
          method: "PATCH",
        },
      );

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, labels.cancelFailed),
        );
      }

      setMessage(labels.cancelSuccess);
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      setError(getClientErrorMessage(error, labels.cancelFailed));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => {
          setDialogOpen(true);
          setError(null);
          setMessage(null);
        }}
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-2xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {labels.cancelAppointment}
      </button>

      {message && <div className="text-xs text-emerald-300">{message}</div>}
      {error && <div className="text-xs text-red-300">{error}</div>}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 py-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-h-[calc(100dvh_-_2rem_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] w-full max-w-sm overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl">
            <h3 className="text-lg font-semibold">{labels.cancelDialogTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {labels.cancelDialogDescription}
            </p>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.cancelKeep}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? labels.cancelling : labels.cancelConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


