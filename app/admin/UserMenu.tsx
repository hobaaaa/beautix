"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminMessages } from "@/lib/i18n/admin";
import type { Locale } from "@/lib/i18n/constants";
import { LogoutButton } from "./LogoutButton";

const avatarPalettes = [
  { background: "#365314", foreground: "#d9f99d" },
  { background: "#164e63", foreground: "#a5f3fc" },
  { background: "#713f12", foreground: "#fef08a" },
  { background: "#4c1d95", foreground: "#ddd6fe" },
  { background: "#7f1d1d", foreground: "#fecaca" },
] as const;

function hashSeed(seed: string) {
  return Array.from(seed).reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) >>> 0;
  }, 0);
}

function UserAvatar({ seed }: { seed: string }) {
  const hash = hashSeed(seed);
  const palette = avatarPalettes[hash % avatarPalettes.length];
  const hairVariant = hash % 3;

  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className="h-full w-full">
      <rect width="40" height="40" rx="20" fill={palette.background} />
      <circle cx="20" cy="21" r="11" fill={palette.foreground} />
      {hairVariant === 0 && (
        <path d="M10 19c1-8 5-12 11-12 6 0 10 4 10 11-4-1-7-3-10-6-2 4-6 6-11 7Z" fill="#27272a" />
      )}
      {hairVariant === 1 && (
        <path d="M10 19c0-8 4-12 11-12 5 0 9 3 10 9-6 0-10-2-14-5-1 4-3 6-7 8Z" fill="#422006" />
      )}
      {hairVariant === 2 && (
        <path d="M10 18c1-7 5-11 11-11 6 0 10 4 10 11l-4-4-3 2-4-4-4 4-3-2-3 4Z" fill="#3f3f46" />
      )}
      <circle cx="16" cy="21" r="1.2" fill="#18181b" />
      <circle cx="24" cy="21" r="1.2" fill="#18181b" />
      <path d="M16 26c2.2 2 5.8 2 8 0" fill="none" stroke="#18181b" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

export function UserMenu({
  userId,
  messages,
  localePrefix,
}: {
  userId: string;
  localePrefix?: Locale;
  messages?: Pick<
    AdminMessages,
    "logout" | "loggingOut" | "logoutFailed" | "userMenuOpen"
  >;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-white/10 transition hover:ring-white/30 focus-visible:outline-none focus-visible:ring-white/50"
        aria-label={messages?.userMenuOpen ?? "Kullanıcı menüsünü aç"}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <UserAvatar seed={userId} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-30 w-44 rounded-2xl border border-white/10 bg-[#1f1f1f] p-2 text-zinc-100 shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
        >
          <LogoutButton
            menuItem
            localePrefix={localePrefix}
            messages={messages}
          />
        </div>
      )}
    </div>
  );
}

