import { LocalizedClientsClient } from "@/app/admin/clients/LocalizedClientsClient";
import { getClients } from "@/app/admin/clients/queries";
import { getAdminMessages } from "@/lib/i18n/admin";
import { isLocale } from "@/lib/i18n/constants";
import { measureServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { notFound } from "next/navigation";

type LocalizedClientsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedClientsPage({
  params,
}: LocalizedClientsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const clients = await measureServerTiming(
    "admin-clients-page",
    "page.total",
    async () => {
      const context = await getCurrentOrgContext("admin-clients-page");
      return getClients(context, "admin-clients-page");
    },
    (result) => ({ clientCount: result.length }),
  );

  return (
    <LocalizedClientsClient
      clients={clients}
      locale={locale}
      messages={getAdminMessages(locale).clients}
    />
  );
}
