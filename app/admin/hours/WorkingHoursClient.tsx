"use client";

import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import { getAdminMessages, type AdminMessages } from "@/lib/i18n/admin";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkingHour } from "../../../types";

type WorkingHoursClientProps = {
  hours: WorkingHour[];
  messages?: AdminMessages["hours"];
};

type WorkingDayForm = {
  day_of_week: number;
  day_name: string;
  is_enabled: boolean;
  start_time: string | null;
  end_time: string | null;
};

function formatTimeForInput(value: string | null | undefined) {
  if (!value) return null;
  return value.slice(0, 5);
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizeWorkingHours(
  hours: WorkingHour[],
  messages: AdminMessages["hours"],
): WorkingDayForm[] {
  const hoursByDay = new Map(hours.map((hour) => [hour.day_of_week, hour]));

  return messages.weekDays.map(({ day_of_week, day_name }) => {
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

export default function WorkingHoursClient({
  hours,
  messages = getAdminMessages().hours,
}: WorkingHoursClientProps) {
  const router = useRouter();
  const initialDays = useMemo(
    () => normalizeWorkingHours(hours, messages),
    [hours, messages],
  );
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
          text: messages.requiredTimes(day.day_name),
        });
        return;
      }

      if (timeToMinutes(day.start_time) >= timeToMinutes(day.end_time)) {
        setMessage({
          type: "error",
          text: messages.invalidRange(day.day_name),
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


      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, messages.saveFailed),
        );
      }

      setMessage({
        type: "success",
        text: messages.saveSuccess,
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          getClientErrorMessage(error, messages.saveFailed),
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
            className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-36">
              <div className="font-medium">{day.day_name}</div>
              <div className="text-sm text-muted-foreground">
                {day.is_enabled ? messages.open : messages.closed}
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
              {messages.active}
            </label>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  {messages.startTime}
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
                  className="min-h-11 w-full rounded-md border px-3 py-2 disabled:opacity-50 sm:w-auto"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  {messages.endTime}
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
                  className="min-h-11 w-full rounded-md border px-3 py-2 disabled:opacity-50 sm:w-auto"
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
        className="min-h-11 w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50 sm:w-auto"
      >
        {loading ? messages.saving : messages.save}
      </button>
    </div>
  );
}

