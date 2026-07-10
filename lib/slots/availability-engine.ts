import {
  generateTimeSlots,
  ISTANBUL_TIME_ZONE,
} from "./slot-engine.ts";
import type {
  SlotInterval,
  TimeSlot,
  WorkingHoursInput,
} from "./slot-engine.ts";

export type AvailabilityAppointment = {
  start_at: string;
  end_at: string;
  status: string;
};

export type AvailableSlot = TimeSlot & {
  label: string;
};

function sortSlots(slots: TimeSlot[]) {
  return [...slots].sort(
    (left, right) =>
      new Date(left.start_at).getTime() - new Date(right.start_at).getTime(),
  );
}

export function isSlotOverlappingAppointment(
  slot: TimeSlot,
  appointment: Pick<AvailabilityAppointment, "start_at" | "end_at">,
) {
  return (
    new Date(slot.start_at).getTime() < new Date(appointment.end_at).getTime() &&
    new Date(slot.end_at).getTime() > new Date(appointment.start_at).getTime()
  );
}

export function getAvailableSlots({
  date,
  workingHours,
  appointments,
  serviceDurationMinutes,
  slotIntervalMinutes = 15,
  timeZone = ISTANBUL_TIME_ZONE,
  nowIso,
}: {
  date: string;
  workingHours: WorkingHoursInput;
  appointments: AvailabilityAppointment[];
  serviceDurationMinutes: number;
  slotIntervalMinutes?: SlotInterval;
  timeZone?: typeof ISTANBUL_TIME_ZONE;
  nowIso?: string;
}): AvailableSlot[] {
  const theoreticalSlots = generateTimeSlots({
    date,
    workingHours,
    serviceDurationMinutes,
    slotIntervalMinutes,
    timeZone,
    nowIso,
  });

  const blockingAppointments = appointments.filter(
    (appointment) => appointment.status !== "cancelled",
  );

  const availableSlots = sortSlots(theoreticalSlots).filter((slot) => {
    return !blockingAppointments.some((appointment) =>
      isSlotOverlappingAppointment(slot, appointment),
    );
  });

  return availableSlots.map((slot) => ({
    ...slot,
    label: slot.start_time,
  }));
}
