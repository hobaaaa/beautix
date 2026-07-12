"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ConfirmAppointmentButtonProps = {
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
};

type CreateAppointmentResponse = {
  success?: boolean;
  error?: string;
};

export function ConfirmAppointmentButton({
  serviceId,
  staffId,
  date,
  time,
}: ConfirmAppointmentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const result = (await response.json()) as CreateAppointmentResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Randevu oluşturulamadı.");
      }

      router.replace("/customer/booking/success");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Randevu oluşturulamadı.");
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
        className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Randevu oluşturuluyor..." : "Randevuyu Onayla"}
      </button>
    </div>
  );
}
