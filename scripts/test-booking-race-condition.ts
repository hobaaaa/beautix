const REQUIRED_ENV_KEYS = [
  "BOOKING_TEST_BASE_URL",
  "BOOKING_TEST_COOKIE",
  "BOOKING_TEST_CLIENT_ID",
  "BOOKING_TEST_APPOINTMENT_TYPE_ID",
  "BOOKING_TEST_STAFF_ID",
  "BOOKING_TEST_SELECTED_SLOT_START",
] as const;

const RACE_MESSAGE =
  "Bu saat az önce başka bir randevu tarafından alındı. Lütfen başka bir saat seçin.";
const UNAVAILABLE_MESSAGE =
  "Seçilen saat artık müsait değil. Lütfen başka bir saat seçin.";

type CreateAppointmentResponse = {
  success?: boolean;
  error?: string;
  data?: {
    id?: string;
  };
};

type RaceRequestSuccess = {
  request: number;
  fulfilled: true;
  status: number;
  ok: boolean;
  body: CreateAppointmentResponse;
};

type RaceRequestFailure = {
  request: number;
  fulfilled: false;
  reason: string;
};

function getEnvOrThrow(key: (typeof REQUIRED_ENV_KEYS)[number]) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} ortam değişkeni zorunludur.`);
  }

  return value;
}

async function sendRequest(baseUrl: string, cookie: string) {
  const response = await fetch(`${baseUrl}/api/admin/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      client_id: getEnvOrThrow("BOOKING_TEST_CLIENT_ID"),
      appointment_type_id: getEnvOrThrow("BOOKING_TEST_APPOINTMENT_TYPE_ID"),
      staff_id: getEnvOrThrow("BOOKING_TEST_STAFF_ID"),
      selected_slot_start: getEnvOrThrow("BOOKING_TEST_SELECTED_SLOT_START"),
      notes: "Race condition test",
    }),
  });

  const json = (await response.json()) as CreateAppointmentResponse;

  return {
    status: response.status,
    ok: response.ok,
    body: json,
  };
}

async function main() {
  for (const key of REQUIRED_ENV_KEYS) {
    getEnvOrThrow(key);
  }

  const baseUrl = getEnvOrThrow("BOOKING_TEST_BASE_URL").replace(/\/$/, "");
  const cookie = getEnvOrThrow("BOOKING_TEST_COOKIE");

  console.log("[race-test] Starting two concurrent create requests...");

  const results = await Promise.allSettled([
    sendRequest(baseUrl, cookie),
    sendRequest(baseUrl, cookie),
  ]);

  const settled: Array<RaceRequestSuccess | RaceRequestFailure> = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return {
        request: index + 1,
        fulfilled: true,
        ...result.value,
      };
    }

    return {
      request: index + 1,
      fulfilled: false,
      reason:
        result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  });

  console.log(JSON.stringify(settled, null, 2));

  const fulfilled = settled.filter(
    (result): result is RaceRequestSuccess => result.fulfilled,
  );

  if (fulfilled.length !== 2) {
    throw new Error("İsteklerden biri ağ seviyesinde başarısız oldu.");
  }

  const successes = fulfilled.filter((result) => result.ok);
  const conflicts = fulfilled.filter(
    (result) =>
      !result.ok &&
      result.status === 409 &&
      (result.body?.error === RACE_MESSAGE ||
        result.body?.error === UNAVAILABLE_MESSAGE),
  );

  if (successes.length !== 1 || conflicts.length !== 1) {
    throw new Error(
      "Beklenen sonuç alınamadı. Bir istek başarılı, diğeri 409 conflict dönmeliydi.",
    );
  }

  console.log("[race-test] Beklenen davranış doğrulandı.");
}

main().catch((error) => {
  console.error(
    "[race-test]",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
