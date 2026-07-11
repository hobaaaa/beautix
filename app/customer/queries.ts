import "server-only";

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

export const isValidOrganizationId = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
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
