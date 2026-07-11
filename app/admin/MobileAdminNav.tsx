"use client";

import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  LayoutDashboard,
  Menu,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigationItems = [
  { href: "/admin", label: "Gösterge Paneli", icon: LayoutDashboard },
  { href: "/admin/services", label: "Hizmetler", icon: BriefcaseBusiness },
  { href: "/admin/staff", label: "Personeller", icon: Users },
  { href: "/admin/appointments", label: "Randevular", icon: CalendarDays },
  { href: "/admin/hours", label: "Çalışma Saatleri", icon: Clock3 },
] as const;

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function MobileAdminNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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
        aria-label="Yönetim menüsünü aç"
        aria-expanded={isOpen}
        aria-controls="mobile-admin-navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-label="Yönetim menüsünü kapat"
          />

          <aside
            id="mobile-admin-navigation"
            className="relative flex h-full w-[min(82vw,320px)] flex-col border-r border-border bg-background p-4 shadow-2xl"
            aria-label="Yönetim menüsü"
          >
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <div>
                <div className="font-semibold">Beautix Yönetim</div>
                <div className="text-xs text-muted-foreground">Menü</div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Menüyü kapat"
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
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-border pt-4 text-xs text-muted-foreground">
              v0.1 (MVP)
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
