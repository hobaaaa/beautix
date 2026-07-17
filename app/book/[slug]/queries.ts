import "server-only";

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

export type PublicBookingData = {
  organization: PublicOrganization | null;
  services: PublicBookingService[];
  selectedService: PublicBookingService | null;
  invalidSelectedService: boolean;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
}: {
  slug: string;
  serviceId?: string;
}): Promise<PublicBookingData> {
  const organization = await getPublicOrganizationBySlug(slug);

  if (!organization) {
    return {
      organization: null,
      services: [],
      selectedService: null,
      invalidSelectedService: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_booking_services", {
    p_public_slug: organization.public_slug,
  });

  if (error) {
    throw error;
  }

  const services = normalizePublicBookingServices(data);
  const hasServiceId = typeof serviceId === "string" && serviceId.trim() !== "";
  const selectedService =
    hasServiceId && UUID_PATTERN.test(serviceId)
      ? services.find((service) => service.id === serviceId) ?? null
      : null;

  return {
    organization,
    services,
    selectedService,
    invalidSelectedService: hasServiceId && !selectedService,
  };
}
