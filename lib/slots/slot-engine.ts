export const ISTANBUL_TIME_ZONE = "Europe/Istanbul";
export const ISTANBUL_UTC_OFFSET = "+03:00";

export type SlotInterval = 15 | 30 | 45 | 60;

export type WorkingHoursInput = {
  start_time: string;
  end_time: string;
};

export type TimeSlot = {
  start_at: string;
  end_at: string;
  start_time: string;
  end_time: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

export function isSupportedSlotInterval(value: number): value is SlotInterval {
  return value === 15 || value === 30 || value === 45 || value === 60;
}

export function parseTimeToMinutes(value: string) {
  const match = TIME_PATTERN.exec(value);

  if (!match) {
    throw new Error("Time must be in HH:mm or HH:mm:ss format.");
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number) {
  if (!Number.isInteger(totalMinutes) || totalMinutes < 0 || totalMinutes > 1439) {
    throw new Error("Minutes must be an integer between 0 and 1439.");
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function combineDateAndTimeInTimezone(
  date: string,
  time: string,
  timeZone = ISTANBUL_TIME_ZONE,
) {
  if (timeZone !== ISTANBUL_TIME_ZONE) {
    throw new Error(`Unsupported time zone: ${timeZone}`);
  }

  if (!DATE_PATTERN.test(date)) {
    throw new Error("Date must be in YYYY-MM-DD format.");
  }

  const normalizedTime = `${minutesToTime(parseTimeToMinutes(time))}:00`;
  const value = new Date(`${date}T${normalizedTime}${ISTANBUL_UTC_OFFSET}`);

  if (Number.isNaN(value.getTime())) {
    throw new Error("Invalid date or time value.");
  }

  return value;
}

function getIstanbulDateParts(referenceIso: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(referenceIso));
  const getValue = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${getValue("year")}-${getValue("month")}-${getValue("day")}`,
    time: `${getValue("hour")}:${getValue("minute")}`,
  };
}

export function generateTimeSlots({
  date,
  workingHours,
  serviceDurationMinutes,
  slotIntervalMinutes = 15,
  timeZone = ISTANBUL_TIME_ZONE,
  nowIso = new Date().toISOString(),
}: {
  date: string;
  workingHours: WorkingHoursInput;
  serviceDurationMinutes: number;
  slotIntervalMinutes?: SlotInterval;
  timeZone?: typeof ISTANBUL_TIME_ZONE;
  nowIso?: string;
}): TimeSlot[] {
  if (!Number.isInteger(serviceDurationMinutes) || serviceDurationMinutes <= 0) {
    throw new Error("Service duration must be a positive integer.");
  }

  if (!isSupportedSlotInterval(slotIntervalMinutes)) {
    throw new Error("Unsupported slot interval.");
  }

  const now = new Date(nowIso);

  if (Number.isNaN(now.getTime())) {
    throw new Error("nowIso must be a valid ISO date string.");
  }

  const workingStartMinutes = parseTimeToMinutes(workingHours.start_time);
  const workingEndMinutes = parseTimeToMinutes(workingHours.end_time);

  if (workingStartMinutes >= workingEndMinutes) {
    throw new Error("Working hours start_time must be earlier than end_time.");
  }

  const { date: currentDateInIstanbul } = getIstanbulDateParts(nowIso);

  if (date < currentDateInIstanbul) {
    return [];
  }

  const latestStartMinutes = workingEndMinutes - serviceDurationMinutes;

  if (latestStartMinutes < workingStartMinutes) {
    return [];
  }

  const slots: TimeSlot[] = [];

  for (
    let startMinutes = workingStartMinutes;
    startMinutes <= latestStartMinutes;
    startMinutes += slotIntervalMinutes
  ) {
    const endMinutes = startMinutes + serviceDurationMinutes;
    const startTime = minutesToTime(startMinutes);
    const endTime = minutesToTime(endMinutes);
    const startAt = combineDateAndTimeInTimezone(date, startTime, timeZone);

    if (startAt.getTime() <= now.getTime()) {
      continue;
    }

    const endAt = combineDateAndTimeInTimezone(date, endTime, timeZone);

    slots.push({
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      start_time: startTime,
      end_time: endTime,
    });
  }

  return slots;
}
