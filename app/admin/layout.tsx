import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  // 1-login kontrol
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 2-org member kontrol (kart 1)
  const { data: memberships, error } = await supabase
    .from("org_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (error || !memberships || memberships.length === 0) {
    redirect("/");
  }

  // 3-UI Shell (kart 2)
  return (
    <div className="min-h-screen bg-background">
      {/* topbar (mobile + desktop) */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="font-semibold">Beautix Admin</div>
            <div className="hidden text-sm text-muted-foreground md-block">
              Panel
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-sm text-muted-foreground sm:block">
              {user.email}
            </div>
            <div className="h-8 w-8 rounded-full bg-muted" />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-0 md:grid-cols-[240px_1fr]">
        {/* sidebar (desktop only) */}
        <aside className="hidden border-r md:block">
          <nav className="flex h-[calc(100vh-56px)] flex-col gap-1 p-4">
            <Link
              href="/admin"
              className="rounded-lg px-3 text-sm hover:bg-muted"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/services"
              className="rounded-lg px-3 text-sm hover:bg-muted"
            >
              Services
            </Link>
            <Link
              href="/admin/hours"
              className="rounded-lg px-3 text-sm hover:bg-muted"
            >
              Working Hours
            </Link>
            <Link
              href="/admin/appointments"
              className="rounded-lg px-3 text-sm hover:bg-muted"
            >
              Appointments
            </Link>
            <div className="mt-auto pt-4 text-xs text-muted-foreground">
              v0.1 (MVP)
            </div>
          </nav>
        </aside>
        {/* main content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

//berolox293@naprb.com
//
