import test from "node:test";
import assert from "node:assert/strict";

import { getAvailableSlots } from "../../lib/slots/availability-engine.ts";

const workingHours = {
  start_time: "09:00",
  end_time: "13:00",
} as const;

test("availability engine returns all theoretical slots when there are no appointments", () => {
  const slots = getAvailableSlots({
    date: "2099-01-01",
    workingHours,
    appointments: [],
    serviceDurationMinutes: 60,
    slotIntervalMinutes: 30,
    nowIso: "2098-12-31T09:00:00.000Z",
  });

  assert.deepEqual(
    slots.map((slot) => slot.start_time),
    ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00"],
  );
});

test("availability engine removes overlapping slots for the same staff timeline", () => {
  const slots = getAvailableSlots({
    date: "2099-01-01",
    workingHours,
    appointments: [
      {
        start_at: "2099-01-01T08:15:00.000Z",
        end_at: "2099-01-01T09:00:00.000Z",
        status: "confirmed",
      },
    ],
    serviceDurationMinutes: 45,
    slotIntervalMinutes: 15,
    nowIso: "2098-12-31T09:00:00.000Z",
  });

  const startTimes = slots.map((slot) => slot.start_time);

  assert.ok(!startTimes.includes("11:15"));
  assert.ok(!startTimes.includes("11:30"));
  assert.ok(!startTimes.includes("11:45"));
  assert.ok(startTimes.includes("12:00"));
  assert.ok(startTimes.includes("10:30"));
});

test("availability engine ignores cancelled appointments", () => {
  const slots = getAvailableSlots({
    date: "2099-01-01",
    workingHours,
    appointments: [
      {
        start_at: "2099-01-01T08:15:00.000Z",
        end_at: "2099-01-01T09:00:00.000Z",
        status: "cancelled",
      },
    ],
    serviceDurationMinutes: 45,
    slotIntervalMinutes: 15,
    nowIso: "2098-12-31T09:00:00.000Z",
  });

  const startTimes = slots.map((slot) => slot.start_time);

  assert.ok(startTimes.includes("11:15"));
  assert.ok(startTimes.includes("11:30"));
  assert.ok(startTimes.includes("11:45"));
});

test("availability engine sorts slots chronologically and treats boundary touch as available", () => {
  const slots = getAvailableSlots({
    date: "2099-01-01",
    workingHours,
    appointments: [
      {
        start_at: "2099-01-01T08:15:00.000Z",
        end_at: "2099-01-01T09:00:00.000Z",
        status: "confirmed",
      },
      {
        start_at: "2099-01-01T06:30:00.000Z",
        end_at: "2099-01-01T07:15:00.000Z",
        status: "confirmed",
      },
    ],
    serviceDurationMinutes: 45,
    slotIntervalMinutes: 15,
    nowIso: "2098-12-31T09:00:00.000Z",
  });

  assert.deepEqual(
    [...slots].map((slot) => slot.start_time),
    [...slots]
      .map((slot) => slot.start_time)
      .sort((left, right) => left.localeCompare(right)),
  );

  const startTimes = slots.map((slot) => slot.start_time);
  assert.ok(startTimes.includes("10:30"));
  assert.ok(startTimes.includes("12:00"));
});
