import {
  AuthRequiredError,
  OrgMembershipRequiredError,
  getCurrentOrgContext,
} from "@/lib/supabase/org";
import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MobileAdminNav } from "./MobileAdminNav";
import { UserMenu } from "./UserMenu";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail = "";
  let userId = "";

  try {
    const { user } = await getCurrentOrgContext("admin-layout");
    userEmail = user.email ?? "";
    userId = user.id;
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
    <div className="min-h-dvh bg-background">
      <header className="sticky top-[env(safe-area-inset-top)] z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <MobileAdminNav />
            <ArtexoBrand compact suffix="Yönetim" />
            <div className="hidden text-sm text-muted-foreground md:block">
              Panel
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden text-sm text-muted-foreground sm:block">
              {userEmail}
            </div>
            <div className="md:hidden">
              <InstallAppButton compact />
            </div>
            <UserMenu userId={userId} />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-0 md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r md:block">
          <nav className="flex h-[calc(100dvh_-_56px_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] flex-col gap-1 p-4">
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
              href="/admin/clients"
              className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
            >
              Müşteriler
            </Link>
            <Link
              href="/admin/appointments"
              className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
            >
              Randevular
            </Link>
            <Link
              href="/admin/notifications"
              className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
            >
              Bildirimler
            </Link>
            <Link
              href="/admin/hours"
              className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
            >
              Çalışma Saatleri
            </Link>
            <Link
              href="/admin/settings"
              className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
            >
              Ayarlar
            </Link>
            <div className="mt-auto space-y-3 pt-4">
              <InstallAppButton />
              <div className="text-xs text-muted-foreground">v0.1 (MVP)</div>
            </div>
          </nav>
        </aside>
        <main className="safe-bottom min-w-0 px-3 py-4 sm:px-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}


