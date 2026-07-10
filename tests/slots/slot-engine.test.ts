import test from "node:test";
import assert from "node:assert/strict";

import {
  generateTimeSlots,
  isSupportedSlotInterval,
} from "../../lib/slots/slot-engine.ts";

test("slot engine produces slots within working hours and respects service duration", () => {
  const slots = generateTimeSlots({
    date: "2099-01-01",
    workingHours: {
      start_time: "09:00",
      end_time: "18:00",
    },
    serviceDurationMinutes: 60,
    slotIntervalMinutes: 30,
    nowIso: "2098-12-31T09:00:00.000Z",
  });

  assert.equal(slots[0]?.start_time, "09:00");
  assert.equal(slots.at(-1)?.start_time, "17:00");
  assert.ok(!slots.some((slot) => slot.start_time === "17:30"));
});

test("slot engine produces 15-minute slots only when service fits", () => {
  const slots = generateTimeSlots({
    date: "2099-01-01",
    workingHours: {
      start_time: "09:00",
      end_time: "10:00",
    },
    serviceDurationMinutes: 30,
    slotIntervalMinutes: 15,
    nowIso: "2098-12-31T09:00:00.000Z",
  });

  assert.deepEqual(
    slots.map((slot) => slot.start_time),
    ["09:00", "09:15", "09:30"],
  );
});

test("slot engine returns an empty list when service does not fit into working hours", () => {
  const slots = generateTimeSlots({
    date: "2099-01-01",
    workingHours: {
      start_time: "09:00",
      end_time: "09:30",
    },
    serviceDurationMinutes: 45,
    slotIntervalMinutes: 15,
    nowIso: "2098-12-31T09:00:00.000Z",
  });

  assert.deepEqual(slots, []);
});

test("slot engine rejects unsupported intervals", () => {
  for (const interval of [0, 10, 20, 90]) {
    assert.equal(isSupportedSlotInterval(interval), false);
    assert.throws(
      () =>
        generateTimeSlots({
          date: "2099-01-01",
          workingHours: {
            start_time: "09:00",
            end_time: "18:00",
          },
          serviceDurationMinutes: 60,
          slotIntervalMinutes: interval as 15,
          nowIso: "2098-12-31T09:00:00.000Z",
        }),
      /Unsupported slot interval/,
    );
  }
});

test("slot engine hides past days and past times for today in Istanbul", () => {
  const pastDaySlots = generateTimeSlots({
    date: "2026-07-09",
    workingHours: {
      start_time: "09:00",
      end_time: "18:00",
    },
    serviceDurationMinutes: 30,
    slotIntervalMinutes: 15,
    nowIso: "2026-07-10T07:20:00.000Z",
  });

  assert.deepEqual(pastDaySlots, []);

  const todaySlots = generateTimeSlots({
    date: "2026-07-10",
    workingHours: {
      start_time: "09:00",
      end_time: "12:00",
    },
    serviceDurationMinutes: 30,
    slotIntervalMinutes: 15,
    nowIso: "2026-07-10T07:20:00.000Z",
  });

  assert.deepEqual(
    todaySlots.map((slot) => slot.start_time),
    ["10:30", "10:45", "11:00", "11:15", "11:30"],
  );
});
