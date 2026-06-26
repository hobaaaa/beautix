import { measureServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import WorkingHoursClient from "./WorkingHoursClient";
import { getWorkingHours } from "./queries";

export default async function HoursPage() {
  const { data } = await measureServerTiming(
    "admin-hours-page",
    "page.total",
    async () => {
      const context = await getCurrentOrgContext("admin-hours-page");
      return getWorkingHours(context, "admin-hours-page");
    },
    (result) => ({ count: result.data?.length ?? 0 }),
  );

  return <WorkingHoursClient hours={data} />;
}
