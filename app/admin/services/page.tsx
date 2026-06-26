import { measureServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { ServiceClient } from "./ServiceClient";
import { getServices } from "./queries";

export default async function ServicesPage() {
  const { data: services } = await measureServerTiming(
    "admin-services-page",
    "page.total",
    async () => {
      const context = await getCurrentOrgContext("admin-services-page");
      return getServices(context, "admin-services-page");
    },
    (result) => ({ count: result.data?.length ?? 0 }),
  );

  return <ServiceClient services={services} />;
}
