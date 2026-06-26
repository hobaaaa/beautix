import "server-only";

import { logServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import type { OrgContext } from "@/lib/supabase/org";

export async function getWorkingHours(
  context?: OrgContext,
  logLabel = "admin-hours-page",
) {
  const { supabase, orgId } = context ?? (await getCurrentOrgContext(logLabel));
  const queryStart = Date.now();

  const { data, error } = await supabase
    .from("working_hours")
    .select("id, org_id, day_of_week, start_time, end_time, created_at")
    .eq("org_id", orgId)
    .order("day_of_week", { ascending: true });

  if (error) {
    throw error;
  }

  logServerTiming(logLabel, "working-hours.query", Date.now() - queryStart, {
    count: data?.length ?? 0,
  });

  return { data };
}
