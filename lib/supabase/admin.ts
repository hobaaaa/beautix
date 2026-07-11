import "server-only";

import { createClient } from "@supabase/supabase-js";

export class SupabaseAdminConfigError extends Error {
  constructor() {
    super("Supabase service role configuration is missing.");
    this.name = "SupabaseAdminConfigError";
  }
}

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new SupabaseAdminConfigError();
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
