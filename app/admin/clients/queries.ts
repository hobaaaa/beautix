import "server-only";

import { logServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import type { OrgContext } from "@/lib/supabase/org";
import type { AppointmentStatus, Client } from "../../../types";

export type AdminClientAppointmentListItem = {
  id: string;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  notes: string | null;
  service: {
    id: string;
    name: string;
    duration_minutes: number;
  };
  staff: {
    id: string;
    name: string;
  };
};

export type AdminClientAppointmentsData = {
  client: Client | null;
  upcomingAppointments: AdminClientAppointmentListItem[];
  pastAppointments: AdminClientAppointmentListItem[];
};

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function pickSingleRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeAppointmentRows(value: unknown): AdminClientAppointmentListItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const service = pickSingleRelation(
        row.service as
          | {
              id: string;
              name: string;
              duration_minutes: number;
            }
          | {
              id: string;
              name: string;
              duration_minutes: number;
            }[]
          | null,
      );
      const staff = pickSingleRelation(
        row.staff as
          | {
              id: string;
              name: string;
            }
          | {
              id: string;
              name: string;
            }[]
          | null,
      );

      if (
        typeof row.id !== "string" ||
        typeof row.start_at !== "string" ||
        typeof row.end_at !== "string" ||
        typeof row.status !== "string"
      ) {
        return null;
      }

      return {
        id: row.id,
        start_at: row.start_at,
        end_at: row.end_at,
        status: row.status as AppointmentStatus,
        notes: typeof row.notes === "string" ? row.notes : null,
        service: service ?? {
          id: "",
          name: "Bilinmeyen hizmet",
          duration_minutes: 0,
        },
        staff: staff ?? {
          id: "",
          name: "Bilinmeyen personel",
        },
      };
    })
    .filter((item): item is AdminClientAppointmentListItem => item !== null);
}

export async function getClients(
  context?: OrgContext,
  logLabel = "admin-clients-page",
): Promise<Client[]> {
  const { supabase, orgId } = context ?? (await getCurrentOrgContext(logLabel));
  const queryStart = Date.now();
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, org_id, user_id, name, first_name, last_name, phone, email, address, notes, birth_date, is_active, created_at",
    )
    .eq("org_id", orgId)
    .order("is_active", { ascending: false })
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true });

  if (error) {
    throw error;
  }

  logServerTiming(logLabel, "clients.query", Date.now() - queryStart, {
    count: data?.length ?? 0,
  });

  return (data ?? []) as Client[];
}

export async function getClientAppointments(
  clientId: string,
  context?: OrgContext,
  logLabel = "admin-client-appointments-page",
): Promise<AdminClientAppointmentsData> {
  const { supabase, orgId } = context ?? (await getCurrentOrgContext(logLabel));

  if (!isValidUuid(clientId)) {
    return {
      client: null,
      upcomingAppointments: [],
      pastAppointments: [],
    };
  }

  const clientQueryStart = Date.now();
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select(
      "id, org_id, user_id, name, first_name, last_name, phone, email, address, notes, birth_date, is_active, created_at",
    )
    .eq("id", clientId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (clientError) {
    throw clientError;
  }

  logServerTiming(logLabel, "client.query", Date.now() - clientQueryStart, {
    found: Boolean(client),
  });

  if (!client) {
    return {
      client: null,
      upcomingAppointments: [],
      pastAppointments: [],
    };
  }

  const nowIso = new Date().toISOString();
  const selectFields = `
    id,
    start_at,
    end_at,
    status,
    notes,
    service:appointment_types (
      id,
      name,
      duration_minutes
    ),
    staff:staff (
      id,
      name
    )
  `;

  const appointmentsQueryStart = Date.now();
  const [
    { data: upcomingAppointments, error: upcomingError },
    { data: pastAppointments, error: pastError },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(selectFields)
      .eq("org_id", orgId)
      .eq("client_id", client.id)
      .neq("status", "cancelled")
      .gte("start_at", nowIso)
      .order("start_at", { ascending: true }),
    supabase
      .from("appointments")
      .select(selectFields)
      .eq("org_id", orgId)
      .eq("client_id", client.id)
      .or(`start_at.lt.${nowIso},status.eq.cancelled`)
      .order("start_at", { ascending: false }),
  ]);

  if (upcomingError) {
    throw upcomingError;
  }

  if (pastError) {
    throw pastError;
  }

  logServerTiming(
    logLabel,
    "client-appointments.query",
    Date.now() - appointmentsQueryStart,
    {
      upcomingCount: upcomingAppointments?.length ?? 0,
      pastCount: pastAppointments?.length ?? 0,
    },
  );

  return {
    client: client as Client,
    upcomingAppointments: normalizeAppointmentRows(upcomingAppointments),
    pastAppointments: normalizeAppointmentRows(pastAppointments),
  };
}
