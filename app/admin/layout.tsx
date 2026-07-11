import {
  AuthRequiredError,
  OrgMembershipRequiredError,
  getCurrentOrgContext,
} from "@/lib/supabase/org";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "./LogoutButton";
import { MobileAdminNav } from "./MobileAdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail = "";

  try {
    const { user } = await getCurrentOrgContext("admin-layout");
    userEmail = user.email ?? "";
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      redirect("/login");
    }

    if (error instanceof OrgMembershipRequiredError) {
      redirect("/");
    }

    throw error;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <MobileAdminNav />
            <div className="font-semibold">Beautix Yönetim</div>
            <div className="hidden text-sm text-muted-foreground md:block">
              Panel
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-sm text-muted-foreground sm:block">
              {userEmail}
            </div>
            <div className="md:hidden">
              <div className="flex items-center gap-2">
                <InstallAppButton compact />
                <LogoutButton compact />
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-muted" />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-0 md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r md:block">
          <nav className="flex h-[calc(100vh-56px)] flex-col gap-1 p-4">
            <Link href="/admin" className="rounded-lg px-3 py-2 text-sm hover:bg-muted">
              Gösterge Paneli
            </Link>
            <Link
              href="/admin/services"
              className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
            >
              Hizmetler
            </Link>
            <Link
              href="/admin/staff"
              className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
            >
              Personeller
            </Link>
            <Link
              href="/admin/appointments"
              className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
            >
              Randevular
            </Link>
            <Link
              href="/admin/hours"
              className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
            >
              Çalışma Saatleri
            </Link>
            <div className="mt-auto space-y-3 pt-4">
              <InstallAppButton />
              <LogoutButton />
              <div className="text-xs text-muted-foreground">v0.1 (MVP)</div>
            </div>
          </nav>
        </aside>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
