import { measureServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { StaffClient } from "./StaffClient";
import { getStaffPageData } from "./queries";

export default async function StaffPage() {
  const { staff, services } = await measureServerTiming(
    "admin-staff-page",
    "page.total",
    async () => {
      const context = await getCurrentOrgContext("admin-staff-page");
      return getStaffPageData(context, "admin-staff-page");
    },
    (result) => ({
      staffCount: result.staff.length,
      serviceCount: result.services.length,
    }),
  );

  return <StaffClient staff={staff} services={services} />;
}
