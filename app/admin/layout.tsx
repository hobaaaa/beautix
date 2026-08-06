import {
  AuthRequiredError,
  OrgMembershipRequiredError,
  getCurrentOrgContext,
} from "@/lib/supabase/org";
import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import {
  getAdminHref,
  getAdminMessages,
  type AdminMessages,
} from "@/lib/i18n/admin";
import type { Locale } from "@/lib/i18n/constants";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MobileAdminNav } from "./MobileAdminNav";
import { UserMenu } from "./UserMenu";

function navigationItems(
  messages: Pick<AdminMessages, "nav">,
  localePrefix?: Locale,
) {
  return [
    { href: getAdminHref("", localePrefix), label: messages.nav.dashboard },
    { href: getAdminHref("/services", localePrefix), label: messages.nav.services },
    { href: getAdminHref("/staff", localePrefix), label: messages.nav.staff },
    { href: getAdminHref("/clients", localePrefix), label: messages.nav.clients },
    {
      href: getAdminHref("/appointments", localePrefix),
      label: messages.nav.appointments,
    },
    {
      href: getAdminHref("/notifications", localePrefix),
      label: messages.nav.notifications,
    },
    { href: getAdminHref("/hours", localePrefix), label: messages.nav.hours },
    { href: getAdminHref("/settings", localePrefix), label: messages.nav.settings },
  ];
}

type AdminUserMenuMessages = Pick<
  AdminMessages,
  "logout" | "loggingOut" | "logoutFailed" | "userMenuOpen"
>;

type AdminMobileNavMessages = Pick<
  AdminMessages,
  "brandSuffix" | "menu" | "openMenu" | "closeMenu" | "close" | "version" | "nav"
>;

export async function AdminLayoutContent({
  children,
  localePrefix,
}: {
  children: React.ReactNode;
  localePrefix?: Locale;
}) {
  const t = getAdminMessages(localePrefix);
  const mobileNavMessages: AdminMobileNavMessages = {
    brandSuffix: t.brandSuffix,
    menu: t.menu,
    openMenu: t.openMenu,
    closeMenu: t.closeMenu,
    close: t.close,
    version: t.version,
    nav: t.nav,
  };
  const userMenuMessages: AdminUserMenuMessages = {
    logout: t.logout,
    loggingOut: t.loggingOut,
    logoutFailed: t.logoutFailed,
    userMenuOpen: t.userMenuOpen,
  };
  let userEmail = "";
  let userId = "";

  try {
    const { user } = await getCurrentOrgContext("admin-layout");
    userEmail = user.email ?? "";
    userId = user.id;
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      redirect(localePrefix ? `/${localePrefix}/login` : "/login");
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
            <MobileAdminNav
              localePrefix={localePrefix}
              messages={mobileNavMessages}
            />
            <ArtexoBrand compact suffix={t.brandSuffix} />
            <div className="hidden text-sm text-muted-foreground md:block">
              {t.panel}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="md:hidden">
              <InstallAppButton compact locale={localePrefix} />
            </div>
            {localePrefix ? (
              <LanguageSwitcher
                currentLocale={localePrefix}
                labels={{ tr: "TR", en: "EN" }}
              />
            ) : null}
            <div className="hidden text-sm text-muted-foreground sm:block">
              {userEmail}
            </div>
            <UserMenu
              userId={userId}
              localePrefix={localePrefix}
              messages={userMenuMessages}
            />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-0 md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r md:block">
          <nav className="flex h-[calc(100dvh_-_56px_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] flex-col gap-1 p-4">
            {navigationItems(t, localePrefix).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-auto space-y-3 pt-4">
              <InstallAppButton locale={localePrefix} />
              <div className="text-xs text-muted-foreground">{t.version}</div>
            </div>
          </nav>
        </aside>
        <main className="safe-bottom min-w-0 px-3 py-4 sm:px-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}


