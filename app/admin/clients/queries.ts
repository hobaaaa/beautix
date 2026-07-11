import "server-only";

import { logServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import type { OrgContext } from "@/lib/supabase/org";
import type { Client } from "../../../types";

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
