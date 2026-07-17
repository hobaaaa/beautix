"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

type PublicDateSelectionProps = {
  slug: string;
  serviceId: string;
  initialDate: string;
  minDate: string;
};

export function PublicDateSelection({
  slug,
  serviceId,
  initialDate,
  minDate,
}: PublicDateSelectionProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedDate) {
      setError("Devam etmek için tarih seçmelisiniz.");
      return;
    }

    if (selectedDate < minDate) {
      setError("Geçmiş bir tarih seçilemez.");
      return;
    }

    const params = new URLSearchParams({
      serviceId,
      date: selectedDate,
    });

    router.push(`/book/${encodeURIComponent(slug)}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="public-booking-date" className="text-sm font-semibold">
          Randevu tarihi
        </label>
        <input
          id="public-booking-date"
          type="date"
          value={selectedDate}
          min={minDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!selectedDate || selectedDate < minDate}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Devam Et
      </button>
    </form>
  );
}
