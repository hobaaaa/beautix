import "server-only";

import { normalizePublicSlug } from "@/lib/organizations/slug";
import { getCurrentOrgContext } from "@/lib/supabase/org";

export type OrganizationSettings = {
  orgId: string;
  name: string;
  public_slug: string;
};

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
  const { supabase, orgId } = await getCurrentOrgContext("admin-settings-page");

  const { data, error } = await supabase
    .from("organization_profiles")
    .select("org_id, name, public_slug")
    .eq("org_id", orgId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const fallbackName = `İşletme ${orgId.slice(0, 8)}`;

  return {
    orgId,
    name:
      typeof data?.name === "string" && data.name.trim() !== ""
        ? data.name.trim()
        : fallbackName,
    public_slug:
      typeof data?.public_slug === "string" && data.public_slug.trim() !== ""
        ? data.public_slug
        : normalizePublicSlug(fallbackName),
  };
}
