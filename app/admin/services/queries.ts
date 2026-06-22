import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getServices() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Kullanıcı doğrulanamadı.");
  }

  const { data: membership, error: memberError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) {
    throw new Error("Kullanıcı herhangi bir işletmeye bağlı değil.");
  }

  const { data, error } = await supabase
    .from("appointment_types")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return { data };
}
