import { getServices } from "@/app/admin/services/queries";
import { ServiceClient } from "@/app/admin/services/ServiceClient";
import { getAdminMessages } from "@/lib/i18n/admin";
import { isLocale } from "@/lib/i18n/constants";
import { measureServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { notFound } from "next/navigation";

export default async function LocalizedServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const { data: services } = await measureServerTiming(
    "admin-services-page",
    "page.total",
    async () => {
      const context = await getCurrentOrgContext("admin-services-page");
      return getServices(context, "admin-services-page");
    },
    (result) => ({ count: result.data?.length ?? 0 }),
  );

  return <ServiceClient services={services} messages={getAdminMessages(locale)} />;
}
