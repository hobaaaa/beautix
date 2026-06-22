import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppointmentListItem, Client, Service } from "../../../types";

type AppointmentRow = {
  id: string;
  org_id: string;
  client_id: string;
  appointment_type_id: string;
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
};

function buildDayRange(date: string) {
  const dayStart = new Date(`${date}T00:00:00+03:00`);
  const nextDayStart = new Date(dayStart);
  nextDayStart.setDate(nextDayStart.getDate() + 1);

  return {
    dayStart: dayStart.toISOString(),
    nextDayStart: nextDayStart.toISOString(),
  };
}

function pickSingleRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function getCurrentOrgId() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  const { data: membership, error: memberError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) {
    throw new Error("User is not a member of any organization");
  }

  return { supabase, orgId: membership.org_id };
}

export async function getAppointmentsByDate(
  date: string,
): Promise<{ data: AppointmentListItem[] }> {
  const { supabase, orgId } = await getCurrentOrgId();

  const { dayStart, nextDayStart } = buildDayRange(date);

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
        id,
        org_id,
        client_id,
        appointment_type_id,
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
        )
      `,
    )
    .eq("org_id", orgId)
    .gte("start_at", dayStart)
    .lt("start_at", nextDayStart)
    .order("start_at", { ascending: true });

  if (error) {
    throw error;
  }

  const normalizedData: AppointmentListItem[] = ((data ?? []) as AppointmentRow[])
    .map((appointment) => {
      const client = pickSingleRelation(appointment.client);
      const service = pickSingleRelation(appointment.service);

      return {
        id: appointment.id,
        org_id: appointment.org_id,
        client_id: appointment.client_id,
        appointment_type_id: appointment.appointment_type_id,
        start_at: appointment.start_at,
        end_at: appointment.end_at,
        status: appointment.status,
        notes: appointment.notes,
        created_at: appointment.created_at,
        client: client ?? {
          id: appointment.client_id,
          name: "Unknown client",
          phone: null,
          email: null,
        },
        service: service ?? {
          id: appointment.appointment_type_id,
          name: "Unknown service",
          duration_minutes: 0,
          is_active: false,
        },
      };
    });

  return { data: normalizedData };
}

export async function getClientsForAppointmentForm(): Promise<{
  data: Client[];
}> {
  const { supabase, orgId } = await getCurrentOrgId();

  const { data, error } = await supabase
    .from("clients")
    .select("id, org_id, user_id, name, phone, email, notes, created_at")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return { data: (data ?? []) as Client[] };
}

export async function getServicesForAppointmentForm(): Promise<{
  data: Service[];
}> {
  const { supabase, orgId } = await getCurrentOrgId();

  const { data, error } = await supabase
    .from("appointment_types")
    .select("id, name, duration_minutes, is_active, created_at, org_id")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return { data: (data ?? []) as Service[] };
}
