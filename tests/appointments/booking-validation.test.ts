import test from "node:test";
import assert from "node:assert/strict";

import {
  parseBookingStart,
  validateBookingWindowAndAvailability,
} from "../../lib/appointments/booking-validation.ts";

const workingHours = {
  start_time: "09:00",
  end_time: "18:00",
} as const;

test("parseBookingStart rejects invalid and past values", () => {
  const invalid = parseBookingStart("invalid-date", "Geçmiş tarih veya saate randevu oluşturulamaz.");
  assert.equal(invalid.ok, false);
  if (!invalid.ok) {
    assert.equal(invalid.error, "Seçilen saat geçersiz.");
  }

  const past = parseBookingStart(
    "2026-07-10T08:00:00.000Z",
    "Geçmiş tarih veya saate randevu oluşturulamaz.",
  );
  assert.equal(past.ok, false);
  if (!past.ok) {
    assert.equal(past.error, "Geçmiş tarih veya saate randevu oluşturulamaz.");
  }
});

test("booking validation rejects closed days and out-of-hours bookings", () => {
  const closedDay = validateBookingWindowAndAvailability({
    appointments: [],
    date: "2099-01-01",
    selectedSlotStart: "2099-01-01T09:00:00.000Z",
    serviceDurationMinutes: 60,
    slotIntervalMinutes: 30,
    workingHours: null,
  });

  assert.equal(closedDay.ok, false);
  if (!closedDay.ok) {
    assert.equal(closedDay.error, "Seçilen gün işletme kapalı.");
  }

  const outOfHours = validateBookingWindowAndAvailability({
    appointments: [],
    date: "2099-01-01",
    selectedSlotStart: "2099-01-01T05:00:00.000Z",
    serviceDurationMinutes: 60,
    slotIntervalMinutes: 30,
    workingHours,
  });

  assert.equal(outOfHours.ok, false);
  if (!outOfHours.ok) {
    assert.equal(outOfHours.error, "Seçilen saat çalışma saatleri dışında.");
  }
});

test("booking validation rejects service durations that overflow working hours", () => {
  const result = validateBookingWindowAndAvailability({
    appointments: [],
    date: "2099-01-01",
    selectedSlotStart: "2099-01-01T14:30:00.000Z",
    serviceDurationMinutes: 60,
    slotIntervalMinutes: 30,
    workingHours,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, "Seçilen saat çalışma saatleri dışında.");
  }
});

test("booking validation rejects manual requests that do not match slot interval", () => {
  const result = validateBookingWindowAndAvailability({
    appointments: [],
    date: "2099-01-01",
    selectedSlotStart: "2099-01-01T06:15:00.000Z",
    serviceDurationMinutes: 60,
    slotIntervalMinutes: 30,
    workingHours,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.error,
      "Seçilen saat geçerli bir randevu başlangıç saati değil.",
    );
  }
});

test("booking validation rejects unavailable slots but allows cancelled ones to be reused", () => {
  const unavailable = validateBookingWindowAndAvailability({
    appointments: [
      {
        start_at: "2099-01-01T08:15:00.000Z",
        end_at: "2099-01-01T09:00:00.000Z",
        status: "confirmed",
      },
    ],
    date: "2099-01-01",
    selectedSlotStart: "2099-01-01T08:30:00.000Z",
    serviceDurationMinutes: 45,
    slotIntervalMinutes: 15,
    workingHours,
  });

  assert.equal(unavailable.ok, false);
  if (!unavailable.ok) {
    assert.equal(
      unavailable.error,
      "Seçilen saat artık müsait değil. Lütfen başka bir saat seçin.",
    );
  }

  const reusableCancelledSlot = validateBookingWindowAndAvailability({
    appointments: [
      {
        start_at: "2099-01-01T08:15:00.000Z",
        end_at: "2099-01-01T09:00:00.000Z",
        status: "cancelled",
      },
    ],
    date: "2099-01-01",
    selectedSlotStart: "2099-01-01T08:30:00.000Z",
    serviceDurationMinutes: 45,
    slotIntervalMinutes: 15,
    workingHours,
  });

  assert.equal(reusableCancelledSlot.ok, true);
});

test("booking validation returns computed endAt for valid bookings", () => {
  const result = validateBookingWindowAndAvailability({
    appointments: [],
    date: "2099-01-01",
    selectedSlotStart: "2099-01-01T06:00:00.000Z",
    serviceDurationMinutes: 60,
    slotIntervalMinutes: 30,
    workingHours,
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.endAt.toISOString(), "2099-01-01T07:00:00.000Z");
  }
});
