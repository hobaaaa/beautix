import "server-only";

import { logServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";

export type DashboardAppointmentItem = {
  id: string;
  start_at: string;
  end_at: string;
  status: "confirmed" | "completed" | "cancelled" | "no_show";
  client_name: string;
  service_name: string;
  staff_name: string;
};

type DashboardAppointmentRow = {
  id: string;
  start_at: string;
  end_at: string;
  status: DashboardAppointmentItem["status"];
  client:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  service:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  staff:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

function pickSingleRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function getTodayInIstanbul() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date());
}

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00+03:00`);
  value.setUTCDate(value.getUTCDate() + amount);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(value);
}

function buildDayRange(date: string) {
  const dayStart = new Date(`${date}T00:00:00+03:00`);
  const nextDayStart = new Date(dayStart);
  nextDayStart.setUTCDate(nextDayStart.getUTCDate() + 1);

  return {
    dayStart: dayStart.toISOString(),
    nextDayStart: nextDayStart.toISOString(),
  };
}

function normalizeAppointments(rows: DashboardAppointmentRow[] | null) {
  return (rows ?? []).map((appointment) => ({
    id: appointment.id,
    start_at: appointment.start_at,
    end_at: appointment.end_at,
    status: appointment.status,
    client_name: pickSingleRelation(appointment.client)?.name ?? "Bilinmeyen müşteri",
    service_name: pickSingleRelation(appointment.service)?.name ?? "Bilinmeyen hizmet",
    staff_name: pickSingleRelation(appointment.staff)?.name ?? "Bilinmeyen personel",
  }));
}

export async function getAdminDashboardData(logLabel = "admin-dashboard-page") {
  const totalStart = Date.now();
  const { supabase, orgId } = await getCurrentOrgContext(logLabel);

  const today = getTodayInIstanbul();
  const tomorrow = addDays(today, 1);
  const { dayStart: todayStart, nextDayStart: tomorrowStart } = buildDayRange(today);
  const { nextDayStart: dayAfterTomorrowStart } = buildDayRange(tomorrow);
  const nowIso = new Date().toISOString();

  const listSelect = `
    id,
    start_at,
    end_at,
    status,
    client:clients (
      name
    ),
    service:appointment_types (
      name
    ),
    staff:staff (
      name
    )
  `;

  const queryStart = Date.now();
  const [
    { count: todayCount, error: todayCountError },
    { count: tomorrowCount, error: tomorrowCountError },
    { count: upcomingCount, error: upcomingCountError },
    { data: todayAppointments, error: todayAppointmentsError },
    { data: tomorrowAppointments, error: tomorrowAppointmentsError },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .neq("status", "cancelled")
      .gte("start_at", todayStart)
      .lt("start_at", tomorrowStart),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .neq("status", "cancelled")
      .gte("start_at", tomorrowStart)
      .lt("start_at", dayAfterTomorrowStart),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .neq("status", "cancelled")
      .gte("start_at", nowIso),
    supabase
      .from("appointments")
      .select(listSelect)
      .eq("org_id", orgId)
      .neq("status", "cancelled")
      .gte("start_at", todayStart)
      .lt("start_at", tomorrowStart)
      .order("start_at", { ascending: true }),
    supabase
      .from("appointments")
      .select(listSelect)
      .eq("org_id", orgId)
      .neq("status", "cancelled")
      .gte("start_at", tomorrowStart)
      .lt("start_at", dayAfterTomorrowStart)
      .order("start_at", { ascending: true }),
  ]);

  if (
    todayCountError ||
    tomorrowCountError ||
    upcomingCountError ||
    todayAppointmentsError ||
    tomorrowAppointmentsError
  ) {
    throw (
      todayCountError ||
      tomorrowCountError ||
      upcomingCountError ||
      todayAppointmentsError ||
      tomorrowAppointmentsError
    );
  }

  logServerTiming(logLabel, "dashboard.queries", Date.now() - queryStart, {
    todayCount: todayCount ?? 0,
    tomorrowCount: tomorrowCount ?? 0,
    upcomingCount: upcomingCount ?? 0,
    todayListCount: todayAppointments?.length ?? 0,
    tomorrowListCount: tomorrowAppointments?.length ?? 0,
  });
  logServerTiming(logLabel, "page.total", Date.now() - totalStart);

  return {
    todayCount: todayCount ?? 0,
    tomorrowCount: tomorrowCount ?? 0,
    upcomingCount: upcomingCount ?? 0,
    todayAppointments: normalizeAppointments(
      (todayAppointments ?? []) as DashboardAppointmentRow[],
    ),
    tomorrowAppointments: normalizeAppointments(
      (tomorrowAppointments ?? []) as DashboardAppointmentRow[],
    ),
  };
}

