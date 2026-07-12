import "server-only";

import { getAvailableSlots } from "@/lib/slots/availability-engine";
import type { AvailableSlot } from "@/lib/slots/availability-engine";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;

      if (
        typeof row.org_id !== "string" ||
        typeof row.client_id !== "string" ||
        typeof row.client_name !== "string"
      ) {
        return null;
      }

      return {
        org_id: row.org_id,
        client_id: row.client_id,
        client_name: row.client_name,
        client_email:
          typeof row.client_email === "string" ? row.client_email : null,
      };
    })
    .filter((item): item is CustomerOrganization => item !== null);
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
