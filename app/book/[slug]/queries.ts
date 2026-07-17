import "server-only";

import { getAvailableSlots } from "@/lib/slots/availability-engine";
import type { AvailableSlot } from "@/lib/slots/availability-engine";
import { isValidPublicSlug, normalizePublicSlug } from "@/lib/organizations/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicOrganization = {
  id: string;
  name: string;
  public_slug: string;
};

export type PublicBookingService = {
  id: string;
  name: string;
  duration_minutes: number;
  description: string | null;
  price: string | null;
};

export type PublicBookingStaff = {
  id: string;
  name: string;
};

export type PublicBookingData = {
  organization: PublicOrganization | null;
  services: PublicBookingService[];
  selectedService: PublicBookingService | null;
  invalidSelectedService: boolean;
  selectedDate: string | null;
  invalidDate: boolean;
  staffMembers: PublicBookingStaff[];
  selectedStaff: PublicBookingStaff | null;
  invalidSelectedStaff: boolean;
  slots: AvailableSlot[];
  today: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getTodayInIstanbul() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date());
}

function isRealDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00+03:00`);

  if (Number.isNaN(date.getTime())) return false;

  return (
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
    }).format(date) === value
  );
}

function getValidFutureOrTodayDate(value: string | undefined, today: string) {
  if (!value || !isRealDate(value) || value < today) {
    return null;
  }

  return value;
}

function getDayOfWeek(date: string) {
  const value = new Date(`${date}T12:00:00+03:00`);
  const day = value.getUTCDay();
  return day === 0 ? 7 : day;
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

function normalizePublicOrganization(value: unknown): PublicOrganization | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;

  if (
    typeof row.id !== "string" ||
    typeof row.name !== "string" ||
    typeof row.public_slug !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    public_slug: row.public_slug,
  };
}

function normalizePublicBookingService(value: unknown): PublicBookingService | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;

  if (
    typeof row.id !== "string" ||
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
    name: row.name,
    duration_minutes: row.duration_minutes,
    description:
      typeof row.description === "string" && row.description.trim() !== ""
        ? row.description.trim()
        : null,
    price,
  };
}

function normalizePublicBookingServices(value: unknown): PublicBookingService[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizePublicBookingService)
    .filter((service): service is PublicBookingService => service !== null);
}

function normalizePublicBookingStaff(value: unknown): PublicBookingStaff[] {
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
    .filter((staff): staff is PublicBookingStaff => staff !== null);
}

function normalizeWorkingHours(value: unknown) {
  const row = Array.isArray(value) ? value[0] : value;

  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;

  if (typeof record.start_time !== "string" || typeof record.end_time !== "string") {
    return null;
  }

  return {
    start_time: record.start_time,
    end_time: record.end_time,
  };
}

export async function getPublicOrganizationBySlug(slug: string) {
  const normalizedSlug = normalizePublicSlug(slug);

  if (normalizedSlug !== slug || !isValidPublicSlug(normalizedSlug)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_organization_by_slug", {
    p_public_slug: normalizedSlug,
  });

  if (error) {
    throw error;
  }

  return normalizePublicOrganization(Array.isArray(data) ? data[0] : null);
}

export async function getPublicBookingData({
  slug,
  serviceId,
  date,
  staffId,
}: {
  slug: string;
  serviceId?: string;
  date?: string;
  staffId?: string;
}): Promise<PublicBookingData> {
  const today = getTodayInIstanbul();
  const organization = await getPublicOrganizationBySlug(slug);
  const emptyBase = {
    organization,
    services: [],
    selectedService: null,
    invalidSelectedService: false,
    selectedDate: null,
    invalidDate: false,
    staffMembers: [],
    selectedStaff: null,
    invalidSelectedStaff: false,
    slots: [],
    today,
  };

  if (!organization) {
    return emptyBase;
  }

  const supabase = await createSupabaseServerClient();
  const { data: servicesData, error: servicesError } = await supabase.rpc(
    "get_public_booking_services",
    {
      p_public_slug: organization.public_slug,
    },
  );

  if (servicesError) {
    throw servicesError;
  }

  const services = normalizePublicBookingServices(servicesData);
  const hasServiceId = typeof serviceId === "string" && serviceId.trim() !== "";
  const selectedService =
    hasServiceId && UUID_PATTERN.test(serviceId)
      ? services.find((service) => service.id === serviceId) ?? null
      : null;
  const invalidSelectedService = hasServiceId && !selectedService;

  if (!selectedService) {
    return {
      ...emptyBase,
      services,
      invalidSelectedService,
    };
  }

  const selectedDate = getValidFutureOrTodayDate(date, today);
  const invalidDate = typeof date === "string" && date.trim() !== "" && !selectedDate;

  if (!selectedDate) {
    return {
      ...emptyBase,
      services,
      selectedService,
      invalidDate,
    };
  }

  const { data: staffData, error: staffError } = await supabase.rpc(
    "get_public_booking_staff",
    {
      p_public_slug: organization.public_slug,
      p_service_id: selectedService.id,
    },
  );

  if (staffError) {
    throw staffError;
  }

  const staffMembers = normalizePublicBookingStaff(staffData);
  const hasStaffId = typeof staffId === "string" && staffId.trim() !== "";
  const selectedStaff =
    staffMembers.length === 1
      ? !hasStaffId || staffId === staffMembers[0].id
        ? staffMembers[0]
        : null
      : staffId && UUID_PATTERN.test(staffId)
        ? staffMembers.find((staff) => staff.id === staffId) ?? null
        : null;
  const invalidSelectedStaff =
    hasStaffId && !selectedStaff;

  if (!selectedStaff) {
    return {
      ...emptyBase,
      services,
      selectedService,
      selectedDate,
      staffMembers,
      invalidSelectedStaff,
    };
  }

  const dayRange = buildDayRange(selectedDate);
  const [{ data: workingHoursData, error: workingHoursError }, busyResult] =
    await Promise.all([
      supabase.rpc("get_public_booking_working_hours", {
        p_public_slug: organization.public_slug,
        p_service_id: selectedService.id,
        p_day_of_week: getDayOfWeek(selectedDate),
      }),
      supabase.rpc("get_public_staff_busy_appointments", {
        p_public_slug: organization.public_slug,
        p_service_id: selectedService.id,
        p_staff_id: selectedStaff.id,
        p_day_start: dayRange.dayStart,
        p_next_day_start: dayRange.nextDayStart,
      }),
    ]);

  if (workingHoursError) {
    throw workingHoursError;
  }

  if (busyResult.error) {
    throw busyResult.error;
  }

  const workingHours = normalizeWorkingHours(workingHoursData);
  const slots = workingHours
    ? getAvailableSlots({
        date: selectedDate,
        workingHours,
        appointments: busyResult.data ?? [],
        serviceDurationMinutes: selectedService.duration_minutes,
      })
    : [];

  return {
    organization,
    services,
    selectedService,
    invalidSelectedService: false,
    selectedDate,
    invalidDate: false,
    staffMembers,
    selectedStaff,
    invalidSelectedStaff,
    slots,
    today,
  };
}
