import { defaultLocale, type Locale } from "@/lib/i18n/constants";
import { measureServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { StaffClient } from "./StaffClient";
import { getStaffPageData } from "./queries";

type StaffPageContentProps = {
  locale?: Locale;
};

export async function StaffPageContent({
  locale = defaultLocale,
}: StaffPageContentProps = {}) {
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

  return <StaffClient staff={staff} services={services} locale={locale} />;
}

export default async function StaffPage() {
  return <StaffPageContent />;
}
