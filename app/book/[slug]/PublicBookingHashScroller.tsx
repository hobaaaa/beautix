"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function PublicBookingHashScroller() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const hash = window.location.hash.slice(1);

    if (!hash) {
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [pathname, searchParams]);

  return null;
}
