"use client";

import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import type { CustomerMessages } from "@/lib/i18n/customer";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ConfirmAppointmentButtonProps = {
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  successHref?: string;
  messages?: Pick<
    CustomerMessages,
    "createFailed" | "creatingAppointment" | "confirmAppointment"
  >;
};

export function ConfirmAppointmentButton({
  serviceId,
  staffId,
  date,
  time,
  successHref = "/customer/booking/success",
  messages,
}: ConfirmAppointmentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const labels = messages ?? {
    createFailed: "Randevu oluşturulamadı.",
    creatingAppointment: "Randevu oluşturuluyor...",
    confirmAppointment: "Randevuyu Onayla",
  };

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/customer/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId,
          staffId,
          date,
          time,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, labels.createFailed),
        );
      }

      router.replace(successHref);
      router.refresh();
    } catch (error) {
      setError(getClientErrorMessage(error, labels.createFailed));
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? labels.creatingAppointment : labels.confirmAppointment}
      </button>
    </div>
  );
}

