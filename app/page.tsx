import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-6">
      <main className="w-full max-w-md rounded-3xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <div className="space-y-3">
          <div className="text-sm font-medium text-blue-400">
            Artexo
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Giriş türünü seçin
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            İşletme paneli veya müşteri hesabı ile devam edin.
          </p>
        </div>

        <div className="mt-8 grid gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-4 text-sm font-medium text-primary-foreground"
          >
            İşletme Girişi
          </Link>
          <Link
            href="/customer/login"
            className="inline-flex items-center justify-center rounded-2xl border px-5 py-4 text-sm font-medium"
          >
            Müşteri Girişi
          </Link>
        </div>
      </main>
    </div>
  );
}
