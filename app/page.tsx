import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPreferredLocale } from "@/lib/i18n/config";
import { redirect } from "next/navigation";

async function resolveSignedInDestination() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1);

  if (!membershipError && memberships && memberships.length > 0) {
    return "/admin";
  }

  const { data: customerOrganizations, error: customerError } = await supabase.rpc(
    "link_customer_clients",
  );

  if (
    !customerError &&
    Array.isArray(customerOrganizations) &&
    customerOrganizations.length > 0
  ) {
    return "/customer";
  }

  return null;
}

export default async function Home() {
  const destination = await resolveSignedInDestination();

  if (destination) {
    redirect(destination);
  }

  redirect(`/${await getPreferredLocale()}`);
}


