import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CustomerLoginForm } from "./CustomerLoginForm";

export default async function CustomerLoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/customer");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
      <CustomerLoginForm />
    </main>
  );
}

