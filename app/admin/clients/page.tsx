import { measureServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { ClientsClient } from "./ClientsClient";
import { getClients } from "./queries";

export default async function ClientsPage() {
  const clients = await measureServerTiming(
    "admin-clients-page",
    "page.total",
    async () => {
      const context = await getCurrentOrgContext("admin-clients-page");
      return getClients(context, "admin-clients-page");
    },
    (result) => ({ clientCount: result.length }),
  );

  return <ClientsClient clients={clients} />;
}
