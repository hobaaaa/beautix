import "server-only";

import { getAvailableSlots } from "@/lib/slots/availability-engine";
import type { AvailableSlot } from "@/lib/slots/availability-engine";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "../../types";
import { cookies } from "next/headers";
import { cache } from "react";

export const CUSTOMER_ORG_COOKIE = "artexo_customer_org_id";

export class CustomerAuthRequiredError extends Error {
  code = "CUSTOMER_AUTH_REQUIRED" as const;
}

export type CustomerOrganization = {
  org_id: string;
  client_id: string;
  client_name: string;
  client_email: string | null;
  organization_name: string | null;
};

export type CustomerDashboardContext = {
  organizations: CustomerOrganization[];
  selectedOrganization: CustomerOrganization | null;
};

export type CustomerServiceListItem = {
  id: string;
  org_id: string;
  name: string;
  duration_minutes: number;
  description: string | null;
  price: string | null;
};

export type CustomerBookingService = {
  id: string;
  org_id: string;
  name: string;
  duration_minutes: number;
  price: string | null;
};

export type CustomerBookingStaff = {
  id: string;
  name: string;
};

export type CustomerBookingAvailability = {
  context: CustomerDashboardContext;
  service: CustomerBookingService | null;
  staffMembers: CustomerBookingStaff[];
  selectedStaff: CustomerBookingStaff | null;
  slots: AvailableSlot[];
};

export type CustomerBookingConfirmation = CustomerBookingAvailability & {
  selectedSlot: AvailableSlot | null;
};

export type CustomerAppointmentListItem = {
  id: string;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
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

export type CustomerAppointmentsData = {
  context: CustomerDashboardContext;
  activeClient: {
    id: string;
  } | null;
  upcomingAppointments: CustomerAppointmentListItem[];
  pastAppointments: CustomerAppointmentListItem[];
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const isValidOrganizationId = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
    value,
  );

const isValidUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

function normalizeOrganizations(value: unknown): CustomerOrganization[] {
  if (!Array.isArray(value)) return [];

  const organizations: CustomerOrganization[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;

    if (
      typeof row.org_id !== "string" ||
      typeof row.client_id !== "string" ||
      typeof row.client_name !== "string"
    ) {
      continue;
    }

    organizations.push({
      org_id: row.org_id,
      client_id: row.client_id,
      client_name: row.client_name,
      client_email: typeof row.client_email === "string" ? row.client_email : null,
      organization_name: null,
    });
  }

  return organizations;
}

export function getCustomerOrganizationDisplayName(
  organization: Pick<CustomerOrganization, "org_id" | "organization_name">,
) {
  return organization.organization_name?.trim() || `İşletme ${organization.org_id.slice(0, 8)}`;
}

function normalizeService(value: unknown): CustomerServiceListItem | null {
  if (!value || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;

  if (
    typeof row.id !== "string" ||
    typeof row.org_id !== "string" ||
    typeof row.name !== "string" ||
    typeof row.duration_minutes !== "number"
  ) {
    return null;
  }

  const price =
    typeof row.price === "number" || typeof row.price === "string"
      ? String(row.price)
      : null;

  return {
    id: row.id,
    org_id: row.org_id,
    name: row.name,
    duration_minutes: row.duration_minutes,
    description:
      typeof row.description === "string" && row.description.trim() !== ""
        ? row.description
        : null,
    price,
  };
}

function normalizeServices(value: unknown): CustomerServiceListItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeService)
    .filter((item): item is CustomerServiceListItem => item !== null);
}

function normalizeBookingService(value: unknown): CustomerBookingService | null {
  const service = normalizeService(value);

  if (!service) {
    return null;
  }

  return {
    id: service.id,
    org_id: service.org_id,
    name: service.name,
    duration_minutes: service.duration_minutes,
    price: service.price,
  };
}

function getDayOfWeek(date: string) {
  const value = new Date(`${date}T12:00:00+03:00`);
  const day = value.getUTCDay();
  return day === 0 ? 7 : day;
}

function buildDayRange(date: string) {
  const dayStart = new Date(`${date}T00:00:00+03:00`);
  const nextDayStart = new Date(dayStart);
  nextDayStart.setDate(nextDayStart.getDate() + 1);

  return {
    dayStart: dayStart.toISOString(),
    nextDayStart: nextDayStart.toISOString(),
  };
}

function normalizeStaffRows(value: unknown): CustomerBookingStaff[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;

      if (typeof row.id !== "string" || typeof row.name !== "string") {
        return null;
      }

      return {
        id: row.id,
        name: row.name,
      };
    })
    .filter((item): item is CustomerBookingStaff => item !== null);
}

function pickSingleRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeAppointmentRows(value: unknown): CustomerAppointmentListItem[] {
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
    .filter((item): item is CustomerAppointmentListItem => item !== null);
}

const resolveCustomerDashboardContext = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new CustomerAuthRequiredError();
  }

  const { data, error } = await supabase.rpc("link_customer_clients");

  if (error) {
    throw error;
  }

  const organizations = normalizeOrganizations(data);

  if (organizations.length > 0) {
    const { data: profileRows, error: profileError } = await supabase
      .from("organization_profiles")
      .select("org_id, name")
      .in(
        "org_id",
        organizations.map((organization) => organization.org_id),
      );

    if (profileError) {
      throw profileError;
    }

    const profileNames = new Map(
      (profileRows ?? [])
        .filter((row) => typeof row.org_id === "string" && typeof row.name === "string")
        .map((row) => [row.org_id, row.name.trim()]),
    );

    for (const organization of organizations) {
      organization.organization_name = profileNames.get(organization.org_id) ?? null;
    }
  }
  const cookieStore = await cookies();
  const selectedOrgId = cookieStore.get(CUSTOMER_ORG_COOKIE)?.value;
  const selectedOrganization =
    organizations.length === 1
      ? organizations[0]
      : organizations.find((organization) => organization.org_id === selectedOrgId) ??
        null;

  return {
    organizations,
    selectedOrganization,
  };
});

export async function getCustomerDashboardContext(): Promise<CustomerDashboardContext> {
  return resolveCustomerDashboardContext();
}

export async function getCustomerServices(): Promise<{
  context: CustomerDashboardContext;
  services: CustomerServiceListItem[];
}> {
  const context = await getCustomerDashboardContext();

  if (!context.selectedOrganization) {
    return {
      context,
      services: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointment_types")
    .select("*")
    .eq("org_id", context.selectedOrganization.org_id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return {
    context,
    services: normalizeServices(data),
  };
}

export async function getCustomerBookingService(
  serviceId: string,
): Promise<{
  context: CustomerDashboardContext;
  service: CustomerBookingService | null;
}> {
  const context = await getCustomerDashboardContext();

  if (!context.selectedOrganization || !isValidUuid(serviceId)) {
    return {
      context,
      service: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointment_types")
    .select("*")
    .eq("id", serviceId)
    .eq("org_id", context.selectedOrganization.org_id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    context,
    service: normalizeBookingService(data),
  };
}

export async function getCustomerBookingAvailability({
  serviceId,
  date,
  staffId,
}: {
  serviceId: string;
  date: string;
  staffId?: string;
}): Promise<CustomerBookingAvailability> {
  const { context, service } = await getCustomerBookingService(serviceId);

  if (!context.selectedOrganization || !service || !DATE_PATTERN.test(date)) {
    return {
      context,
      service,
      staffMembers: [],
      selectedStaff: null,
      slots: [],
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: mappings, error: mappingsError } = await supabase
    .from("staff_appointment_types")
    .select("staff_id")
    .eq("appointment_type_id", service.id);

  if (mappingsError) {
    throw mappingsError;
  }

  const staffIds = [...new Set((mappings ?? []).map((mapping) => mapping.staff_id))];

  if (staffIds.length === 0) {
    return {
      context,
      service,
      staffMembers: [],
      selectedStaff: null,
      slots: [],
    };
  }

  const { data: staffRows, error: staffError } = await supabase
    .from("staff")
    .select("id, name")
    .eq("org_id", context.selectedOrganization.org_id)
    .eq("is_active", true)
    .in("id", staffIds)
    .order("name", { ascending: true });

  if (staffError) {
    throw staffError;
  }

  const staffMembers = normalizeStaffRows(staffRows);
  const selectedStaff =
    staffMembers.length === 1
      ? staffMembers[0]
      : staffId && isValidUuid(staffId)
        ? staffMembers.find((staffMember) => staffMember.id === staffId) ?? null
        : null;

  if (!selectedStaff) {
    return {
      context,
      service,
      staffMembers,
      selectedStaff: null,
      slots: [],
    };
  }

  const dayOfWeek = getDayOfWeek(date);
  const { data: workingHour, error: workingHourError } = await supabase
    .from("working_hours")
    .select("start_time, end_time")
    .eq("org_id", context.selectedOrganization.org_id)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (workingHourError) {
    throw workingHourError;
  }

  if (!workingHour) {
    return {
      context,
      service,
      staffMembers,
      selectedStaff,
      slots: [],
    };
  }

  const { dayStart, nextDayStart } = buildDayRange(date);
  const { data: appointments, error: appointmentsError } = await supabase.rpc(
    "get_customer_staff_busy_appointments",
    {
      p_org_id: context.selectedOrganization.org_id,
      p_staff_id: selectedStaff.id,
      p_day_start: dayStart,
      p_next_day_start: nextDayStart,
    },
  );

  if (appointmentsError) {
    throw appointmentsError;
  }

  const slots = getAvailableSlots({
    date,
    workingHours: workingHour,
    appointments: appointments ?? [],
    serviceDurationMinutes: service.duration_minutes,
  });

  return {
    context,
    service,
    staffMembers,
    selectedStaff,
    slots,
  };
}

export async function getCustomerBookingConfirmation({
  serviceId,
  date,
  staffId,
  time,
}: {
  serviceId: string;
  date: string;
  staffId: string;
  time: string;
}): Promise<CustomerBookingConfirmation> {
  const availability = await getCustomerBookingAvailability({
    serviceId,
    date,
    staffId,
  });

  return {
    ...availability,
    selectedSlot:
      availability.selectedStaff && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
        ? availability.slots.find((slot) => slot.start_time === time) ?? null
        : null,
  };
}

export async function getCustomerAppointments(): Promise<CustomerAppointmentsData> {
  const context = await getCustomerDashboardContext();

  if (!context.selectedOrganization) {
    return {
      context,
      activeClient: null,
      upcomingAppointments: [],
      pastAppointments: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: activeClient, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", context.selectedOrganization.client_id)
    .eq("org_id", context.selectedOrganization.org_id)
    .eq("is_active", true)
    .maybeSingle();

  if (clientError) {
    throw clientError;
  }

  if (!activeClient) {
    return {
      context,
      activeClient: null,
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

  const [
    { data: upcomingAppointments, error: upcomingError },
    { data: pastAppointments, error: pastError },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(selectFields)
      .eq("org_id", context.selectedOrganization.org_id)
      .eq("client_id", activeClient.id)
      .neq("status", "cancelled")
      .gte("start_at", nowIso)
      .order("start_at", { ascending: true }),
    supabase
      .from("appointments")
      .select(selectFields)
      .eq("org_id", context.selectedOrganization.org_id)
      .eq("client_id", activeClient.id)
      .or(`start_at.lt.${nowIso},status.eq.cancelled`)
      .order("start_at", { ascending: false }),
  ]);

  if (upcomingError) {
    throw upcomingError;
  }

  if (pastError) {
    throw pastError;
  }

  return {
    context,
    activeClient,
    upcomingAppointments: normalizeAppointmentRows(upcomingAppointments),
    pastAppointments: normalizeAppointmentRows(pastAppointments),
  };
}
