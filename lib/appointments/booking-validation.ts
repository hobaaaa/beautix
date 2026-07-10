import {
  getAvailableSlots,
} from "../slots/availability-engine.ts";
import type { AvailabilityAppointment } from "../slots/availability-engine.ts";
import {
  generateTimeSlots,
  ISTANBUL_TIME_ZONE,
} from "../slots/slot-engine.ts";
import type { SlotInterval, WorkingHoursInput } from "../slots/slot-engine.ts";

const ISTANBUL_OFFSET = "+03:00";

export const DEFAULT_SLOT_INTERVAL_MINUTES: SlotInterval = 15;
export const APPOINTMENT_UNAVAILABLE_MESSAGE =
  "Seçilen saat artık müsait değil. Lütfen başka bir saat seçin.";
export const APPOINTMENT_RACE_CONDITION_MESSAGE =
  "Bu saat az önce başka bir randevu tarafından alındı. Lütfen başka bir saat seçin.";

export function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function getDayOfWeek(date: string) {
  const value = new Date(`${date}T12:00:00${ISTANBUL_OFFSET}`);
  const day = value.getUTCDay();
  return day === 0 ? 7 : day;
}

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatDateInIstanbul(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TIME_ZONE,
  }).format(new Date(value));
}

export function formatTimeInIstanbul(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: ISTANBUL_TIME_ZONE,
  }).format(new Date(value));
}

export function buildDayRange(date: string) {
  const dayStart = new Date(`${date}T00:00:00${ISTANBUL_OFFSET}`);
  const nextDayStart = new Date(dayStart);
  nextDayStart.setDate(nextDayStart.getDate() + 1);

  return {
    dayStart: dayStart.toISOString(),
    nextDayStart: nextDayStart.toISOString(),
  };
}

export function isOverlapConstraintError(error: { code?: string; message?: string }) {
  return (
    error.code === "23P01" ||
    error.message?.includes("appointments_no_overlap") ||
    error.message?.includes("appointments_no_overlap_by_staff") ||
    error.message?.toLowerCase().includes("exclusion constraint")
  );
}

export function parseBookingStart(
  selectedSlotStart: string,
  pastMessage: string,
): { ok: true; startAt: Date; appointmentDate: string; startTime: string; dayOfWeek: number } | {
  ok: false;
  error: string;
  status: number;
} {
  const startAt = new Date(selectedSlotStart);

  if (Number.isNaN(startAt.getTime())) {
    return {
      ok: false,
      error: "Seçilen saat geçersiz.",
      status: 400,
    };
  }

  if (startAt.getTime() <= Date.now()) {
    return {
      ok: false,
      error: pastMessage,
      status: 400,
    };
  }

  const appointmentDate = formatDateInIstanbul(startAt.toISOString());
  const startTime = formatTimeInIstanbul(startAt.toISOString());

  return {
    ok: true,
    startAt,
    appointmentDate,
    startTime,
    dayOfWeek: getDayOfWeek(appointmentDate),
  };
}

export function validateBookingWindowAndAvailability({
  appointments,
  date,
  selectedSlotStart,
  serviceDurationMinutes,
  slotIntervalMinutes = DEFAULT_SLOT_INTERVAL_MINUTES,
  workingHours,
}: {
  appointments: AvailabilityAppointment[];
  date: string;
  selectedSlotStart: string;
  serviceDurationMinutes: number;
  slotIntervalMinutes?: SlotInterval;
  workingHours: WorkingHoursInput | null;
}):
  | { ok: true; endAt: Date }
  | { ok: false; error: string; status: number } {
  if (!workingHours) {
    return {
      ok: false,
      error: "Seçilen gün işletme kapalı.",
      status: 400,
    };
  }

  const startAt = new Date(selectedSlotStart);

  if (Number.isNaN(startAt.getTime())) {
    return {
      ok: false,
      error: "Seçilen saat geçersiz.",
      status: 400,
    };
  }

  if (!Number.isInteger(serviceDurationMinutes) || serviceDurationMinutes <= 0) {
    return {
      ok: false,
      error: "Seçilen hizmetin süresi geçersiz.",
      status: 400,
    };
  }

  const startTime = formatTimeInIstanbul(startAt.toISOString());
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + serviceDurationMinutes;
  const workingStartMinutes = timeToMinutes(workingHours.start_time);
  const workingEndMinutes = timeToMinutes(workingHours.end_time);

  if (startMinutes < workingStartMinutes || startMinutes >= workingEndMinutes) {
    return {
      ok: false,
      error: "Seçilen saat çalışma saatleri dışında.",
      status: 400,
    };
  }

  if (endMinutes > workingEndMinutes) {
    return {
      ok: false,
      error: "Seçilen saat çalışma saatleri dışında.",
      status: 400,
    };
  }

  const theoreticalSlots = generateTimeSlots({
    date,
    workingHours,
    serviceDurationMinutes,
    slotIntervalMinutes,
  });

  const isValidSlotStart = theoreticalSlots.some(
    (slot) => slot.start_at === startAt.toISOString(),
  );

  if (!isValidSlotStart) {
    return {
      ok: false,
      error: "Seçilen saat geçerli bir randevu başlangıç saati değil.",
      status: 400,
    };
  }

  const availableSlots = getAvailableSlots({
    date,
    workingHours,
    appointments,
    serviceDurationMinutes,
    slotIntervalMinutes,
  });

  const isAvailable = availableSlots.some(
    (slot) => slot.start_at === startAt.toISOString(),
  );

  if (!isAvailable) {
    return {
      ok: false,
      error: APPOINTMENT_UNAVAILABLE_MESSAGE,
      status: 409,
    };
  }

  return {
    ok: true,
    endAt: new Date(startAt.getTime() + serviceDurationMinutes * 60000),
  };
}
