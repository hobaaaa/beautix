"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import type { CustomerMessages } from "@/lib/i18n/customer";

type CustomerDateSelectionProps = {
  initialDate: string;
  minDate: string;
  serviceId: string;
  bookingBaseHref?: string;
  messages?: Pick<
    CustomerMessages,
    "dateRequired" | "pastDate" | "appointmentDate" | "continue"
  >;
};

export function CustomerDateSelection({
  initialDate,
  minDate,
  serviceId,
  bookingBaseHref = "/customer/booking",
  messages,
}: CustomerDateSelectionProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [error, setError] = useState<string | null>(null);
  const labels = messages ?? {
    dateRequired: "Devam etmek için tarih seçmelisiniz.",
    pastDate: "Geçmiş bir tarih seçilemez.",
    appointmentDate: "Randevu tarihi",
    continue: "Devam Et",
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedDate) {
      setError(labels.dateRequired);
      return;
    }

    if (selectedDate < minDate) {
      setError(labels.pastDate);
      return;
    }

    const params = new URLSearchParams({
      serviceId,
      date: selectedDate,
    });

    router.push(`${bookingBaseHref}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="appointment-date" className="text-sm font-semibold">
          {labels.appointmentDate}
        </label>
        <input
          id="appointment-date"
          type="date"
          value={selectedDate}
          min={minDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!selectedDate || selectedDate < minDate}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {labels.continue}
      </button>
    </form>
  );
}

