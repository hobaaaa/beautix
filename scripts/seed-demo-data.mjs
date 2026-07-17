import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DEMO_MARKER = "ARTEXO_DEMO_DATA_V1";
const DEMO_PREFIX = "[DEMO]";
const ISTANBUL_OFFSET = "+03:00";

const isDryRun = process.argv.includes("--dry-run");

function loadLocalEnv() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  }
}

loadLocalEnv();

const requiredEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  DEMO_ORG_ID: process.env.DEMO_ORG_ID,
};

function fail(message) {
  console.error(`[demo-seed] ${message}`);
  process.exit(1);
}

function safeError(error) {
  if (!error) return "unknown_error";
  return [error.code, error.message].filter(Boolean).join(": ").slice(0, 240);
}

function assertConfig() {
  if (process.env.ALLOW_DEMO_SEED !== "true") {
    fail("ALLOW_DEMO_SEED=true olmadan demo seed calismaz.");
  }

  for (const [key, value] of Object.entries(requiredEnv)) {
    if (!value) {
      fail(`${key} env degeri zorunludur.`);
    }
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requiredEnv.DEMO_ORG_ID)) {
    fail("DEMO_ORG_ID gecerli bir UUID olmalidir.");
  }
}

function createSupabase() {
  return createClient(
    requiredEnv.NEXT_PUBLIC_SUPABASE_URL,
    requiredEnv.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function toIstanbulDate(value) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(value);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function combineDateAndTime(date, time) {
  return new Date(`${date}T${time}:00${ISTANBUL_OFFSET}`);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000);
}

function isOverlap(leftStart, leftEnd, rightStart, rightEnd) {
  return leftStart < rightEnd && leftEnd > rightStart;
}

function normalizeName(value) {
  return `${DEMO_PREFIX} ${value}`;
}

function logStage(stage, details) {
  console.log(`[demo-seed] ${stage}: ${details}`);
}

async function validateOrganization(supabase, orgId) {
  const { data, error } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("org_id", orgId)
    .limit(1);

  if (error) {
    fail(`organization validate failed: ${safeError(error)}`);
  }

  if (!data || data.length === 0) {
    fail("DEMO_ORG_ID icin org_members kaydi bulunamadi.");
  }

  logStage("organization", "validated");
}

async function ensureWorkingHours(supabase, orgId) {
  const weekdays = [1, 2, 3, 4, 5, 6];
  const rows = weekdays.map((day) => ({
    org_id: orgId,
    day_of_week: day,
    start_time: day === 6 ? "10:00" : "09:00",
    end_time: day === 6 ? "17:00" : "18:00",
  }));

  if (isDryRun) {
    logStage("working_hours", `${rows.length} row planned`);
    return rows;
  }

  const { error } = await supabase
    .from("working_hours")
    .upsert(rows, { onConflict: "org_id,day_of_week" });

  if (error) {
    fail(`working_hours failed: ${safeError(error)}`);
  }

  logStage("working_hours", `${rows.length} row upserted`);
  return rows;
}

const serviceDefinitions = [
  ["Cilt Bakimi", 60, true],
  ["Lazer Epilasyon", 60, true],
  ["Fizyoterapi Seansi", 45, true],
  ["Diyetisyen Gorumesi", 30, true],
  ["Masaj Terapisi", 60, true],
  ["Dis Beyazlatma On Degerlendirme", 30, true],
  ["Psikolog Gorusmesi", 50, true],
  ["Pasif Demo Hizmet", 30, false],
];

async function ensureServices(supabase, orgId) {
  const result = new Map();
  let created = 0;
  let reused = 0;

  for (const [label, duration, isActive] of serviceDefinitions) {
    const name = normalizeName(label);
    const { data: existing, error: lookupError } = await supabase
      .from("appointment_types")
      .select("id, name")
      .eq("org_id", orgId)
      .eq("name", name)
      .maybeSingle();

    if (lookupError) fail(`service lookup failed: ${safeError(lookupError)}`);

    if (existing) {
      result.set(label, existing.id);
      reused += 1;
      continue;
    }

    if (isDryRun) {
      result.set(label, `dry-service-${result.size + 1}`);
      created += 1;
      continue;
    }

    const { data, error } = await supabase
      .from("appointment_types")
      .insert({
        org_id: orgId,
        name,
        duration_minutes: duration,
        is_active: isActive,
      })
      .select("id")
      .single();

    if (error) fail(`service insert failed: ${safeError(error)}`);

    result.set(label, data.id);
    created += 1;
  }

  logStage("services", `${created} created, ${reused} existing`);
  return result;
}

const staffDefinitions = [
  ["Ayse Kaya", true, ["Cilt Bakimi", "Lazer Epilasyon", "Masaj Terapisi"]],
  ["Mehmet Demir", true, ["Fizyoterapi Seansi", "Masaj Terapisi"]],
  ["Elif Yilmaz", true, ["Diyetisyen Gorumesi", "Psikolog Gorusmesi"]],
  ["Can Aydin", true, ["Dis Beyazlatma On Degerlendirme", "Cilt Bakimi"]],
  ["Zeynep Arslan", true, ["Lazer Epilasyon", "Cilt Bakimi"]],
  ["Pasif Personel", false, ["Pasif Demo Hizmet"]],
];

async function ensureStaffAndMappings(supabase, orgId, servicesByLabel) {
  const staffByLabel = new Map();
  let created = 0;
  let reused = 0;
  let mappingsCreated = 0;

  for (const [label, isActive, serviceLabels] of staffDefinitions) {
    const name = normalizeName(label);
    const { data: existing, error: lookupError } = await supabase
      .from("staff")
      .select("id")
      .eq("org_id", orgId)
      .eq("name", name)
      .maybeSingle();

    if (lookupError) fail(`staff lookup failed: ${safeError(lookupError)}`);

    let staffId = existing?.id;

    if (staffId) {
      reused += 1;
    } else if (isDryRun) {
      staffId = `dry-staff-${staffByLabel.size + 1}`;
      created += 1;
    } else {
      const { data, error } = await supabase
        .from("staff")
        .insert({
          org_id: orgId,
          name,
          is_active: isActive,
        })
        .select("id")
        .single();

      if (error) fail(`staff insert failed: ${safeError(error)}`);

      staffId = data.id;
      created += 1;
    }

    staffByLabel.set(label, staffId);

    for (const serviceLabel of serviceLabels) {
      const serviceId = servicesByLabel.get(serviceLabel);
      if (!serviceId) continue;

      if (isDryRun) {
        mappingsCreated += 1;
        continue;
      }

      const { error } = await supabase.from("staff_appointment_types").upsert(
        {
          staff_id: staffId,
          appointment_type_id: serviceId,
        },
        { onConflict: "staff_id,appointment_type_id" },
      );

      if (error) fail(`staff mapping failed: ${safeError(error)}`);
      mappingsCreated += 1;
    }
  }

  logStage(
    "staff",
    `${created} created, ${reused} existing, ${mappingsCreated} mappings ensured`,
  );
  return staffByLabel;
}

const clientFirstNames = [
  "Deniz",
  "Merve",
  "Selin",
  "Burak",
  "Ece",
  "Ali",
  "Derya",
  "Emre",
  "Irem",
  "Kerem",
  "Nil",
  "Ozan",
  "Pelin",
  "Seda",
  "Tolga",
  "Yagmur",
  "Bora",
  "Ceren",
  "Gizem",
  "Murat",
];

const clientLastNames = [
  "Yildiz",
  "Acar",
  "Koc",
  "Sahin",
  "Polat",
  "Eren",
  "Kurt",
  "Tas",
  "Ozer",
  "Aslan",
  "Celik",
  "Kaplan",
  "Gunes",
  "Bulut",
  "Aksoy",
  "Turan",
  "Arikan",
  "Dogan",
  "Erdem",
  "Kilic",
];

async function ensureClients(supabase, orgId) {
  const clients = [];
  let created = 0;
  let reused = 0;

  for (let index = 0; index < 20; index += 1) {
    const firstName = clientFirstNames[index];
    const lastName = clientLastNames[index];
    const email = `artexo-demo-client-${String(index + 1).padStart(2, "0")}@example.com`;
    const isActive = index < 18;

    const { data: existing, error: lookupError } = await supabase
      .from("clients")
      .select("id, notes")
      .eq("org_id", orgId)
      .eq("email", email)
      .maybeSingle();

    if (lookupError) fail(`client lookup failed: ${safeError(lookupError)}`);

    if (existing) {
      clients.push({ id: existing.id, isActive });
      reused += 1;
      continue;
    }

    if (isDryRun) {
      clients.push({ id: `dry-client-${index + 1}`, isActive });
      created += 1;
      continue;
    }

    const { data, error } = await supabase
      .from("clients")
      .insert({
        org_id: orgId,
        user_id: null,
        name: `${DEMO_PREFIX} ${firstName} ${lastName}`,
        first_name: `${DEMO_PREFIX} ${firstName}`,
        last_name: lastName,
        phone: `+90 555 010 ${String(index + 1).padStart(2, "0")} ${String(index + 1).padStart(2, "0")}`,
        email,
        address: `Demo Mahallesi ${index + 1}. Sokak No:${index + 10}`,
        notes: `${DEMO_MARKER} - Demo musteri`,
        birth_date: `199${index % 10}-0${(index % 9) + 1}-15`,
        is_active: isActive,
      })
      .select("id")
      .single();

    if (error) fail(`client insert failed: ${safeError(error)}`);

    clients.push({ id: data.id, isActive });
    created += 1;
  }

  logStage("clients", `${created} created, ${reused} existing`);
  return clients;
}

const appointmentPlan = [
  [-12, "10:00", "completed", "Deniz", "Cilt Bakimi", "Ayse Kaya"],
  [-12, "11:30", "completed", "Merve", "Fizyoterapi Seansi", "Mehmet Demir"],
  [-11, "14:00", "no_show", "Selin", "Diyetisyen Gorumesi", "Elif Yilmaz"],
  [-10, "09:30", "completed", "Burak", "Dis Beyazlatma On Degerlendirme", "Can Aydin"],
  [-9, "13:00", "cancelled", "Ece", "Lazer Epilasyon", "Zeynep Arslan"],
  [-8, "15:00", "completed", "Ali", "Masaj Terapisi", "Ayse Kaya"],
  [-7, "10:30", "completed", "Derya", "Psikolog Gorusmesi", "Elif Yilmaz"],
  [-6, "16:00", "completed", "Emre", "Cilt Bakimi", "Can Aydin"],
  [-5, "11:00", "no_show", "Irem", "Lazer Epilasyon", "Ayse Kaya"],
  [-4, "14:30", "completed", "Kerem", "Masaj Terapisi", "Mehmet Demir"],
  [-3, "09:00", "completed", "Nil", "Diyetisyen Gorumesi", "Elif Yilmaz"],
  [-2, "12:00", "cancelled", "Ozan", "Fizyoterapi Seansi", "Mehmet Demir"],
  [0, "10:00", "confirmed", "Pelin", "Cilt Bakimi", "Ayse Kaya"],
  [0, "11:30", "confirmed", "Seda", "Diyetisyen Gorumesi", "Elif Yilmaz"],
  [0, "14:00", "cancelled", "Tolga", "Masaj Terapisi", "Mehmet Demir"],
  [1, "09:30", "confirmed", "Yagmur", "Lazer Epilasyon", "Zeynep Arslan"],
  [1, "13:00", "confirmed", "Bora", "Dis Beyazlatma On Degerlendirme", "Can Aydin"],
  [2, "10:00", "confirmed", "Ceren", "Psikolog Gorusmesi", "Elif Yilmaz"],
  [2, "15:00", "confirmed", "Gizem", "Fizyoterapi Seansi", "Mehmet Demir"],
  [3, "11:00", "confirmed", "Murat", "Cilt Bakimi", "Ayse Kaya"],
  [4, "09:00", "confirmed", "Deniz", "Lazer Epilasyon", "Zeynep Arslan"],
  [4, "12:30", "confirmed", "Merve", "Masaj Terapisi", "Mehmet Demir"],
  [5, "14:00", "confirmed", "Selin", "Diyetisyen Gorumesi", "Elif Yilmaz"],
  [6, "10:30", "confirmed", "Burak", "Dis Beyazlatma On Degerlendirme", "Can Aydin"],
  [7, "16:00", "confirmed", "Ece", "Cilt Bakimi", "Ayse Kaya"],
  [8, "09:30", "confirmed", "Ali", "Fizyoterapi Seansi", "Mehmet Demir"],
  [9, "11:00", "confirmed", "Derya", "Psikolog Gorusmesi", "Elif Yilmaz"],
  [10, "13:30", "confirmed", "Emre", "Masaj Terapisi", "Ayse Kaya"],
  [11, "15:00", "confirmed", "Irem", "Lazer Epilasyon", "Zeynep Arslan"],
  [12, "10:00", "confirmed", "Kerem", "Cilt Bakimi", "Can Aydin"],
  [13, "14:30", "confirmed", "Nil", "Diyetisyen Gorumesi", "Elif Yilmaz"],
  [14, "09:00", "confirmed", "Ozan", "Fizyoterapi Seansi", "Mehmet Demir"],
  [15, "11:30", "confirmed", "Pelin", "Dis Beyazlatma On Degerlendirme", "Can Aydin"],
  [16, "13:00", "confirmed", "Seda", "Cilt Bakimi", "Ayse Kaya"],
  [17, "15:30", "confirmed", "Tolga", "Psikolog Gorusmesi", "Elif Yilmaz"],
  [18, "10:30", "confirmed", "Yagmur", "Lazer Epilasyon", "Zeynep Arslan"],
  [19, "12:00", "confirmed", "Bora", "Masaj Terapisi", "Mehmet Demir"],
  [20, "14:00", "confirmed", "Ceren", "Cilt Bakimi", "Ayse Kaya"],
  [21, "09:30", "cancelled", "Gizem", "Fizyoterapi Seansi", "Mehmet Demir"],
  [22, "16:00", "confirmed", "Murat", "Diyetisyen Gorumesi", "Elif Yilmaz"],
];

async function ensureAppointments({
  supabase,
  orgId,
  servicesByLabel,
  staffByLabel,
  clients,
}) {
  const today = new Date();
  const clientByFirstName = new Map(
    clientFirstNames.map((firstName, index) => [firstName, clients[index]]),
  );
  const durationByService = new Map(
    serviceDefinitions.map(([label, duration]) => [label, duration]),
  );
  const planned = [];

  for (const [dayOffset, time, status, clientFirstName, serviceLabel, staffLabel] of appointmentPlan) {
    const date = toIstanbulDate(addDays(today, dayOffset));
    const startAt = combineDateAndTime(date, time);
    const duration = durationByService.get(serviceLabel);
    const endAt = addMinutes(startAt, duration);
    const client = clientByFirstName.get(clientFirstName);
    const serviceId = servicesByLabel.get(serviceLabel);
    const staffId = staffByLabel.get(staffLabel);

    if (!client?.isActive || !serviceId || !staffId || !duration) continue;

    planned.push({
      org_id: orgId,
      client_id: client.id,
      appointment_type_id: serviceId,
      staff_id: staffId,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      status,
      notes: `${DEMO_MARKER} - Demo randevu`,
    });
  }

  if (isDryRun) {
    logStage("appointments", `${planned.length} row planned`);
    return { created: planned.length, existing: 0, skipped: 0 };
  }

  const rangeStart = planned
    .map((item) => item.start_at)
    .sort()[0];
  const rangeEnd = planned
    .map((item) => item.end_at)
    .sort()
    .at(-1);

  const { data: existingAppointments, error: existingError } = await supabase
    .from("appointments")
    .select("id, staff_id, start_at, end_at, status, notes")
    .eq("org_id", orgId)
    .gte("start_at", rangeStart)
    .lt("start_at", rangeEnd);

  if (existingError) fail(`appointment lookup failed: ${safeError(existingError)}`);
  const existingAppointmentRows = existingAppointments ?? [];

  let created = 0;
  let existing = 0;
  let skipped = 0;

  for (const appointment of planned) {
    const duplicate = existingAppointmentRows.some(
      (item) =>
        item.staff_id === appointment.staff_id &&
        item.start_at === appointment.start_at &&
        item.notes === appointment.notes,
    );

    if (duplicate) {
      existing += 1;
      continue;
    }

    const conflictsRealData =
      appointment.status !== "cancelled" &&
      existingAppointmentRows.some((item) => {
        if (item.status === "cancelled" || item.staff_id !== appointment.staff_id) {
          return false;
        }

        return isOverlap(
          new Date(appointment.start_at).getTime(),
          new Date(appointment.end_at).getTime(),
          new Date(item.start_at).getTime(),
          new Date(item.end_at).getTime(),
        );
      });

    if (conflictsRealData) {
      skipped += 1;
      continue;
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert(appointment)
      .select("id, staff_id, start_at, end_at, status, notes")
      .single();

    if (error) fail(`appointment insert failed: ${safeError(error)}`);

    existingAppointmentRows.push(data);
    created += 1;
  }

  logStage(
    "appointments",
    `${created} created, ${existing} existing, ${skipped} skipped because of existing schedule`,
  );
  return { created, existing, skipped };
}

async function main() {
  assertConfig();
  const supabase = createSupabase();
  const orgId = requiredEnv.DEMO_ORG_ID;

  console.log(`[demo-seed] mode=${isDryRun ? "dry-run" : "write"}`);
  await validateOrganization(supabase, orgId);
  await ensureWorkingHours(supabase, orgId);
  const servicesByLabel = await ensureServices(supabase, orgId);
  const staffByLabel = await ensureStaffAndMappings(supabase, orgId, servicesByLabel);
  const clients = await ensureClients(supabase, orgId);
  const appointmentSummary = await ensureAppointments({
    supabase,
    orgId,
    servicesByLabel,
    staffByLabel,
    clients,
  });

  console.log("[demo-seed] complete", {
    services: serviceDefinitions.length,
    staff: staffDefinitions.length,
    clients: clientFirstNames.length,
    appointments: appointmentSummary,
  });
}

main().catch((error) => {
  fail(`unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
});
