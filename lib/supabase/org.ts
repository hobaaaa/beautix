import "server-only";

import { logServerTiming } from "@/lib/perf";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cache } from "react";

export class AuthRequiredError extends Error {
  code = "AUTH_REQUIRED" as const;

  constructor(message = "Kullanıcı doğrulanamadı.") {
    super(message);
  }
}

export class OrgMembershipRequiredError extends Error {
  code = "ORG_MEMBERSHIP_REQUIRED" as const;

  constructor(message = "Kullanıcı herhangi bir işletmeye bağlı değil.") {
    super(message);
  }
}

const resolveCurrentOrgContext = cache(async () => {
  const totalStart = Date.now();
  const supabase = await createSupabaseServerClient();

  const authStart = Date.now();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  const authMs = Date.now() - authStart;

  if (authError || !user) {
    throw new AuthRequiredError();
  }

  const orgStart = Date.now();
  const { data: membership, error: memberError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();
  const orgResolveMs = Date.now() - orgStart;

  if (memberError || !membership) {
    throw new OrgMembershipRequiredError();
  }

  return {
    supabase,
    user,
    orgId: membership.org_id,
    timings: {
      authMs,
      orgResolveMs,
      totalMs: Date.now() - totalStart,
    },
  };
});

export type OrgContext = Omit<
  Awaited<ReturnType<typeof resolveCurrentOrgContext>>,
  "timings"
>;

export async function getCurrentOrgContext(logLabel?: string): Promise<OrgContext> {
  const context = await resolveCurrentOrgContext();

  if (logLabel) {
    logServerTiming(logLabel, "auth.getUser", context.timings.authMs);
    logServerTiming(logLabel, "org.resolve", context.timings.orgResolveMs);
    logServerTiming(logLabel, "org.context.total", context.timings.totalMs);
  }

  return {
    supabase: context.supabase,
    user: context.user,
    orgId: context.orgId,
  };
}

