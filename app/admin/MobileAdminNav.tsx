"use client";

import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import {
  getAdminHref,
  getAdminMessages,
  type AdminMessages,
} from "@/lib/i18n/admin";
import type { Locale } from "@/lib/i18n/constants";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  ContactRound,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

function getNavigationItems(messages: AdminMessages, localePrefix?: Locale) {
  return [
    {
      href: getAdminHref("", localePrefix),
      label: messages.nav.dashboard,
      icon: LayoutDashboard,
    },
    {
      href: getAdminHref("/services", localePrefix),
      label: messages.nav.services,
      icon: BriefcaseBusiness,
    },
    {
      href: getAdminHref("/staff", localePrefix),
      label: messages.nav.staff,
      icon: Users,
    },
    {
      href: getAdminHref("/clients", localePrefix),
      label: messages.nav.clients,
      icon: ContactRound,
    },
    {
      href: getAdminHref("/appointments", localePrefix),
      label: messages.nav.appointments,
      icon: CalendarDays,
    },
    {
      href: getAdminHref("/notifications", localePrefix),
      label: messages.nav.notifications,
      icon: Bell,
    },
    {
      href: getAdminHref("/hours", localePrefix),
      label: messages.nav.hours,
      icon: Clock3,
    },
    {
      href: getAdminHref("/settings", localePrefix),
      label: messages.nav.settings,
      icon: Settings,
    },
  ] as const;
}

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function MobileAdminNav({
  localePrefix,
  messages,
}: {
  localePrefix?: Locale;
  messages?: AdminMessages;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const labels = messages ?? getAdminMessages();
  const navigationItems = getNavigationItems(labels, localePrefix);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={labels.openMenu}
        aria-expanded={isOpen}
        aria-controls="mobile-admin-navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/80"
              onClick={() => setIsOpen(false)}
              aria-label={labels.closeMenu}
            />

            <aside
              id="mobile-admin-navigation"
              className="relative flex h-dvh w-[min(86vw,320px)] flex-col overflow-y-auto border-r border-white/10 bg-[#171717] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-zinc-100 shadow-2xl"
              aria-label="Yönetim menüsü"
            >
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <ArtexoBrand compact suffix={labels.brandSuffix} />
                  <div className="text-xs text-zinc-400">{labels.menu}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-white"
                  aria-label={labels.close}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        active
                          ? "bg-white/10 font-medium text-white"
                          : "text-zinc-400 hover:bg-white/10 hover:text-white"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto border-t border-white/10 pt-4 text-xs text-zinc-500">
                {labels.version}
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </div>
  );
}

