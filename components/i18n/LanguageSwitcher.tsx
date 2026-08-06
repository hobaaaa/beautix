"use client";

import { localeCookieName, locales, type Locale } from "@/lib/i18n/constants";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type LanguageSwitcherProps = {
  currentLocale: Locale;
  labels: Record<Locale, string>;
};

function buildLocaleHref(pathname: string, search: string, locale: Locale) {
  const segments = pathname.split("/").filter(Boolean);
  const hasLocalePrefix = locales.includes(segments[0] as Locale);

  if (hasLocalePrefix) {
    segments[0] = locale;
  } else {
    segments.unshift(locale);
  }

  return `/${segments.join("/")}${search ? `?${search}` : ""}`;
}

export function LanguageSwitcher({
  currentLocale,
  labels,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  return (
    <div className="inline-flex rounded-full border border-white/10 bg-background/60 p-1 text-xs">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={buildLocaleHref(pathname, search, locale)}
          onClick={() => {
            document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
          }}
          aria-current={locale === currentLocale ? "page" : undefined}
          className={[
            "rounded-full px-3 py-1.5 transition",
            locale === currentLocale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {labels[locale]}
        </Link>
      ))}
    </div>
  );
}
