import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { getCustomerMessages } from "@/lib/i18n/customer";
import type { Locale } from "@/lib/i18n/constants";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CustomerLogoutButton } from "./CustomerLogoutButton";

type CustomerPanelHeaderProps = {
  backHref?: string;
  backLabel?: string;
  localePrefix?: Locale;
};

export function CustomerPanelHeader({
  backHref,
  backLabel,
  localePrefix,
}: CustomerPanelHeaderProps) {
  const t = getCustomerMessages(localePrefix);
  const logoutMessages = {
    logout: t.logout,
    loggingOut: t.loggingOut,
    logoutFailed: t.logoutFailed,
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-h-6">
        {backHref && backLabel ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <InstallAppButton compact locale={localePrefix} />
        {localePrefix ? (
          <LanguageSwitcher
            currentLocale={localePrefix}
            labels={{ tr: "TR", en: "EN" }}
          />
        ) : null}
        <CustomerLogoutButton
          localePrefix={localePrefix}
          messages={logoutMessages}
        />
      </div>
    </div>
  );
}
