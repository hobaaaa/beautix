"use client";

import type { Locale } from "@/lib/i18n/constants";
import {
  buildPublicBookingHref,
  type PublicBookingMessages,
} from "@/lib/i18n/public-booking";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

type PublicDateSelectionProps = {
  slug: string;
  serviceId: string;
  initialDate: string;
  minDate: string;
  localePrefix?: Locale;
  messages: Pick<
    PublicBookingMessages,
    "dateInputLabel" | "dateRequired" | "pastDate" | "continue"
  >;
};

export function PublicDateSelection({
  slug,
  serviceId,
  initialDate,
  minDate,
  localePrefix,
  messages,
}: PublicDateSelectionProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedDate) {
      setError(messages.dateRequired);
      return;
    }

    if (selectedDate < minDate) {
      setError(messages.pastDate);
      return;
    }

    const params = new URLSearchParams({
      serviceId,
      date: selectedDate,
    });

    router.push(
      buildPublicBookingHref({
        slug,
        localePrefix,
        params,
        hash: "staff-selection",
      }),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="public-booking-date" className="text-sm font-semibold">
          {messages.dateInputLabel}
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
        {messages.continue}
      </button>
    </form>
  );
}
