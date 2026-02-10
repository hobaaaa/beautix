"use server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getServices() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  const { data: membership, error: memberError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) {
    throw new Error("User is not a member of any organization");
  }

  const { data, error } = await supabase
    .from("appointment_types")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return { data };
}
export async function createService(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const name = formData.get("name") as string;
  const duration = Number(formData.get("duration_minutes"));

  if (!name) {
    throw new Error("Name is required");
  }

  if (!Number.isInteger(duration) || duration <= 0 || duration === 600) {
    throw new Error("Duration must be between 1 and 600 minutes");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  const { data: membership, error: memberError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) {
    throw new Error("User is not a member of any organization");
  }

  const { error } = await supabase.from("appointment_types").insert({
    name,
    duration_minutes: duration,
    org_id: membership.org_id,
  });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/services");
}
export async function deleteService(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("appointment_types")
    .delete()
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/services");
}
export async function toggleServiceActiveStatus(id: string, isActive: boolean) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("appointment_types")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/admin/services");
}
