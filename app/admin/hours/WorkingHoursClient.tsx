"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkingHour } from "../../../types";

type WorkingHoursClientProps = {
  hours: WorkingHour[];
};

type WorkingDayForm = {
  day_of_week: number;
  day_name: string;
  is_enabled: boolean;
  start_time: string | null;
  end_time: string | null;
};

const WEEK_DAYS: Array<{ day_of_week: number; day_name: string }> = [
  { day_of_week: 1, day_name: "Pazartesi" },
  { day_of_week: 2, day_name: "Salı" },
  { day_of_week: 3, day_name: "Çarşamba" },
  { day_of_week: 4, day_name: "Perşembe" },
  { day_of_week: 5, day_name: "Cuma" },
  { day_of_week: 6, day_name: "Cumartesi" },
  { day_of_week: 7, day_name: "Pazar" },
];

function formatTimeForInput(value: string | null | undefined) {
  if (!value) return null;
  return value.slice(0, 5);
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizeWorkingHours(hours: WorkingHour[]): WorkingDayForm[] {
  const hoursByDay = new Map(hours.map((hour) => [hour.day_of_week, hour]));

  return WEEK_DAYS.map(({ day_of_week, day_name }) => {
    const existing = hoursByDay.get(day_of_week);

    return {
      day_of_week,
      day_name,
      is_enabled: Boolean(existing),
      start_time: formatTimeForInput(existing?.start_time) ?? "09:00",
      end_time: formatTimeForInput(existing?.end_time) ?? "18:00",
    };
  });
}

export default function WorkingHoursClient({ hours }: WorkingHoursClientProps) {
  const router = useRouter();
  const initialDays = useMemo(() => normalizeWorkingHours(hours), [hours]);
  const [days, setDays] = useState<WorkingDayForm[]>(initialDays);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function updateDay(
    dayOfWeek: number,
    updater: (current: WorkingDayForm) => WorkingDayForm,
  ) {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.day_of_week === dayOfWeek ? updater(day) : day,
      ),
    );
  }

  async function handleSave() {
    for (const day of days) {
      if (!day.is_enabled) {
        continue;
      }

      if (!day.start_time || !day.end_time) {
        setMessage({
          type: "error",
          text: `${day.day_name}: başlangıç ve bitiş saati zorunludur.`,
        });
        return;
      }

      if (timeToMinutes(day.start_time) >= timeToMinutes(day.end_time)) {
        setMessage({
          type: "error",
          text: `${day.day_name}: başlangıç saati bitiş saatinden önce olmalıdır.`,
        });
        return;
      }
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/hours", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          days: days.map((day) => ({
            day_of_week: day.day_of_week,
            is_enabled: day.is_enabled,
            start_time: day.is_enabled ? day.start_time : null,
            end_time: day.is_enabled ? day.end_time : null,
          })),
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Çalışma saatleri kaydedilemedi.");
      }

      setMessage({
        type: "success",
        text: "Çalışma saatleri başarıyla güncellendi.",
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Çalışma saatleri kaydedilemedi.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        {days.map((day) => (
          <div
            key={day.day_of_week}
            className="rounded-lg border p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-36">
              <div className="font-medium">{day.day_name}</div>
              <div className="text-sm text-muted-foreground">
                {day.is_enabled ? "Açık" : "Kapalı"}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={day.is_enabled}
                onChange={(event) =>
                  updateDay(day.day_of_week, (current) => ({
                    ...current,
                    is_enabled: event.target.checked,
                  }))
                }
              />
              Aktif
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  Başlangıç saati
                </label>
                <input
                  type="time"
                  value={day.start_time ?? ""}
                  disabled={!day.is_enabled || loading}
                  onChange={(event) =>
                    updateDay(day.day_of_week, (current) => ({
                      ...current,
                      start_time: event.target.value,
                    }))
                  }
                  className="rounded-md border px-3 py-2 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  Bitiş saati
                </label>
                <input
                  type="time"
                  value={day.end_time ?? ""}
                  disabled={!day.is_enabled || loading}
                  onChange={(event) =>
                    updateDay(day.day_of_week, (current) => ({
                      ...current,
                      end_time: event.target.value,
                    }))
                  }
                  className="rounded-md border px-3 py-2 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Kaydediliyor..." : "Çalışma Saatlerini Kaydet"}
      </button>
    </div>
  );
}
