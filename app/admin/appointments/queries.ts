import "server-only";

import { logServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import type { OrgContext } from "@/lib/supabase/org";
import { AppointmentListItem, Client } from "../../../types";

type AppointmentRow = {
  id: string;
  org_id: string;
  client_id: string;
  appointment_type_id: string;
  staff_id: string;
  start_at: string;
  end_at: string;
  status: AppointmentListItem["status"];
  notes: string | null;
  created_at: string;
  client:
    | {
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
      }
    | {
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
      }[]
    | null;
  service:
    | {
        id: string;
        name: string;
        duration_minutes: number;
        is_active: boolean;
      }
    | {
        id: string;
        name: string;
        duration_minutes: number;
        is_active: boolean;
      }[]
    | null;
  staff:
    | {
        id: string;
        name: string;
        is_active: boolean;
      }
    | {
        id: string;
        name: string;
        is_active: boolean;
      }[]
    | null;
};

type AppointmentFilters = {
  appointmentTypeId?: string;
  staffId?: string;
};

export type AppointmentListView = "day" | "all";

function buildDayRange(date: string) {
  const dayStart = new Date(`${date}T00:00:00+03:00`);
  const nextDayStart = new Date(dayStart);
  nextDayStart.setDate(nextDayStart.getDate() + 1);

  return {
    dayStart: dayStart.toISOString(),
    nextDayStart: nextDayStart.toISOString(),
  };
}

function buildAllRange() {
  const current = new Date();
  const start = new Date(current);
  start.setMonth(start.getMonth() - 3);
  return start.toISOString();
}

function pickSingleRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function sortDailyAppointments(appointments: AppointmentListItem[]) {
  return [...appointments].sort((left, right) => {
    const leftWeight = left.status === "cancelled" ? 1 : 0;
    const rightWeight = right.status === "cancelled" ? 1 : 0;

    if (leftWeight !== rightWeight) {
      return leftWeight - rightWeight;
    }

    return new Date(left.start_at).getTime() - new Date(right.start_at).getTime();
  });
}

function sortAllAppointments(appointments: AppointmentListItem[]) {
  return [...appointments].sort(
    (left, right) => new Date(right.start_at).getTime() - new Date(left.start_at).getTime(),
  );
}

export async function getAppointmentsByDate(
  date: string,
  filters: AppointmentFilters = {},
  context?: OrgContext,
  logLabel = "admin-appointments-page",
  options: {
    view?: AppointmentListView;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<{ data: AppointmentListItem[]; hasMore: boolean }> {
  const { supabase, orgId } = context ?? (await getCurrentOrgContext(logLabel));
  const view = options.view ?? "day";
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 10;
  const queryStart = Date.now();

  let query = supabase
    .from("appointments")
    .select(
      `
        id,
        org_id,
        client_id,
        appointment_type_id,
        staff_id,
        start_at,
        end_at,
        status,
        notes,
        created_at,
        client:clients (
          id,
          name,
          phone,
          email
        ),
        service:appointment_types (
          id,
          name,
          duration_minutes,
          is_active
        ),
        staff:staff (
          id,
          name,
          is_active
        )
      `,
    )
    .eq("org_id", orgId);

  if (view === "day") {
    const { dayStart, nextDayStart } = buildDayRange(date);
    query = query
      .gte("start_at", dayStart)
      .lt("start_at", nextDayStart)
      .order("start_at", { ascending: true });
  } else {
    const allStart = buildAllRange();
    const offset = (page - 1) * pageSize;
    query = query
      .gte("start_at", allStart)
      .order("start_at", { ascending: false })
      .range(offset, offset + pageSize);
  }

  if (filters.appointmentTypeId) {
    query = query.eq("appointment_type_id", filters.appointmentTypeId);
  }

  if (filters.staffId) {
    query = query.eq("staff_id", filters.staffId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  logServerTiming(logLabel, "appointments.query", Date.now() - queryStart, {
    count: data?.length ?? 0,
    view,
    page,
    hasAppointmentTypeFilter: Boolean(filters.appointmentTypeId),
    hasStaffFilter: Boolean(filters.staffId),
  });

  const normalizedData: AppointmentListItem[] = ((data ?? []) as AppointmentRow[]).map(
    (appointment) => {
      const client = pickSingleRelation(appointment.client);
      const service = pickSingleRelation(appointment.service);
      const staff = pickSingleRelation(appointment.staff);

      return {
        id: appointment.id,
        org_id: appointment.org_id,
        client_id: appointment.client_id,
        appointment_type_id: appointment.appointment_type_id,
        staff_id: appointment.staff_id || staff?.id || "",
        start_at: appointment.start_at,
        end_at: appointment.end_at,
        status: appointment.status,
        notes: appointment.notes,
        created_at: appointment.created_at,
        client: client ?? {
          id: appointment.client_id,
          name: "Bilinmeyen müşteri",
          phone: null,
          email: null,
        },
        service: service ?? {
          id: appointment.appointment_type_id,
          name: "Bilinmeyen hizmet",
          duration_minutes: 0,
          is_active: false,
        },
        staff: staff ?? {
          id: appointment.staff_id,
          name: "Bilinmeyen personel",
          is_active: false,
        },
      };
    },
  );

  const appointments =
    view === "day"
      ? sortDailyAppointments(normalizedData)
      : sortAllAppointments(normalizedData);

  return {
    data: view === "all" ? appointments.slice(0, pageSize) : appointments,
    hasMore: view === "all" ? appointments.length > pageSize : false,
  };
}

export async function getClientsForAppointmentForm(
  context?: OrgContext,
  logLabel = "admin-appointments-page",
): Promise<{
  data: Client[];
}> {
  const { supabase, orgId } = context ?? (await getCurrentOrgContext(logLabel));
  const queryStart = Date.now();

  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, org_id, user_id, name, first_name, last_name, phone, email, address, notes, birth_date, is_active, created_at",
    )
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  logServerTiming(logLabel, "appointment-form.clients-query", Date.now() - queryStart, {
    count: data?.length ?? 0,
  });

  return { data: (data ?? []) as Client[] };
}
