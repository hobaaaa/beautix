import { getAdminMessages } from "@/lib/i18n/admin";
import { defaultLocale, type Locale } from "@/lib/i18n/constants";
import { measureServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import WorkingHoursClient from "./WorkingHoursClient";
import { getWorkingHours } from "./queries";

type HoursPageContentProps = {
  locale?: Locale;
};

export async function HoursPageContent({
  locale = defaultLocale,
}: HoursPageContentProps = {}) {
  const { data } = await measureServerTiming(
    "admin-hours-page",
    "page.total",
    async () => {
      const context = await getCurrentOrgContext("admin-hours-page");
      return getWorkingHours(context, "admin-hours-page");
    },
    (result) => ({ count: result.data?.length ?? 0 }),
  );

  return <WorkingHoursClient hours={data} messages={getAdminMessages(locale).hours} />;
}

export default async function HoursPage() {
  return <HoursPageContent />;
}
