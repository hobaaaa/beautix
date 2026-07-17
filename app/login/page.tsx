import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-12 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <LoginForm />
    </div>
  );
}

