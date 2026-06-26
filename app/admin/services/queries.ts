import "server-only";

import { logServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import type { OrgContext } from "@/lib/supabase/org";

export async function getServices(
  context?: OrgContext,
  logLabel = "admin-services-page",
) {
  const { supabase, orgId } = context ?? (await getCurrentOrgContext(logLabel));
  const queryStart = Date.now();

  const { data, error } = await supabase
    .from("appointment_types")
    .select("id, name, duration_minutes, is_active, created_at, org_id")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  logServerTiming(logLabel, "services.query", Date.now() - queryStart, {
    count: data?.length ?? 0,
  });

  return { data };
}
