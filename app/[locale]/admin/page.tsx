import { getAdminDashboardData } from "@/app/admin/queries";
import { getAdminHref, getAdminMessages } from "@/lib/i18n/admin";
import { isLocale, type Locale } from "@/lib/i18n/constants";
import Link from "next/link";
import { notFound } from "next/navigation";

function formatTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default async function LocalizedAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = getAdminMessages(locale);
  const dashboard = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{t.dashboard.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t.dashboard.description}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={getAdminHref("/appointments", locale)}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm text-white"
          >
            {t.dashboard.newAppointment}
          </Link>
          <Link
            href={getAdminHref("/services", locale)}
            className="inline-flex min-h-11 items-center justify-center rounded-md border px-3 py-2 text-sm"
          >
            {t.nav.services}
          </Link>
          <Link
            href={getAdminHref("/staff", locale)}
            className="inline-flex min-h-11 items-center justify-center rounded-md border px-3 py-2 text-sm"
          >
            {t.nav.staff}
          </Link>
          <Link
            href={getAdminHref("/hours", locale)}
            className="inline-flex min-h-11 items-center justify-center rounded-md border px-3 py-2 text-sm"
          >
            {t.nav.hours}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">{t.dashboard.today}</div>
          <div className="mt-2 text-3xl font-semibold">{dashboard.todayCount}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t.dashboard.todayCountDescription}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">
            {t.dashboard.tomorrow}
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {dashboard.tomorrowCount}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t.dashboard.tomorrowCountDescription}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">
            {t.dashboard.upcomingAppointments}
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {dashboard.upcomingCount}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t.dashboard.upcomingCountDescription}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border p-4">
          <div className="mb-4 font-medium">{t.dashboard.todayAppointments}</div>
          {dashboard.todayAppointments.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t.dashboard.noTodayAppointments}
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-[72px_1fr]"
                >
                  <div className="font-medium">
                    {formatTime(appointment.start_at, locale)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="break-words font-medium">
                      {appointment.client_name}
                    </div>
                    <div className="break-words text-muted-foreground">
                      {appointment.service_name} - {appointment.staff_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.dashboard.statusLabels[appointment.status]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border p-4">
          <div className="mb-4 font-medium">
            {t.dashboard.tomorrowAppointments}
          </div>
          {dashboard.tomorrowAppointments.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t.dashboard.noTomorrowAppointments}
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.tomorrowAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-[72px_1fr]"
                >
                  <div className="font-medium">
                    {formatTime(appointment.start_at, locale)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="break-words font-medium">
                      {appointment.client_name}
                    </div>
                    <div className="break-words text-muted-foreground">
                      {appointment.service_name} - {appointment.staff_name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
