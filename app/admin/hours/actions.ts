import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getWorkingHours() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("working_hours")
    .select("*")
    .order("day", { ascending: true });
  if (error) throw error;

  return { data };
}
