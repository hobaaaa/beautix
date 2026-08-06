import { getAppointmentsByDate } from "@/app/admin/appointments/queries";
import type { AppointmentListView } from "@/app/admin/appointments/queries";
import { AppointmentsClient } from "@/app/admin/appointments/AppointmentsClient";
import { getClientsForAppointmentForm } from "@/app/admin/appointments/queries";
import { getStaffPageData } from "@/app/admin/staff/queries";
import { isLocale } from "@/lib/i18n/constants";
import { measureServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { notFound } from "next/navigation";

type LocalizedAppointmentsPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams?: Promise<{
    date?: string;
    appointmentTypeId?: string;
    staffId?: string;
    view?: string;
    page?: string;
  }>;
};

function getTodayInIstanbul() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date());
}

function isValidDate(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isValidUuid(value: string | undefined) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}

function isValidView(value: string | undefined): value is AppointmentListView {
  return value === "day" || value === "all";
}

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default async function LocalizedAppointmentsPage({
  params,
  searchParams,
}: LocalizedAppointmentsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const queryParams = (await searchParams) ?? {};
  const selectedDate = isValidDate(queryParams.date)
    ? queryParams.date!
    : getTodayInIstanbul();
  const selectedAppointmentTypeId = isValidUuid(queryParams.appointmentTypeId)
    ? queryParams.appointmentTypeId!
    : "";
  const selectedStaffId = isValidUuid(queryParams.staffId)
    ? queryParams.staffId!
    : "";
  const selectedView: AppointmentListView = isValidView(queryParams.view)
    ? queryParams.view
    : "day";
  const currentPage = selectedView === "all" ? parsePage(queryParams.page) : 1;

  const { appointments, hasMore, clients, allStaffMembers, allServices } =
    await measureServerTiming(
      "admin-appointments-page",
      "page.total",
      async () => {
        const context = await getCurrentOrgContext("admin-appointments-page");
        const [
          { data: appointments, hasMore },
          { data: clients },
          { staff: allStaffMembers, services: allServices },
        ] = await Promise.all([
          getAppointmentsByDate(
            selectedDate,
            {
              appointmentTypeId: selectedAppointmentTypeId || undefined,
              staffId: selectedStaffId || undefined,
            },
            context,
            "admin-appointments-page",
            {
              view: selectedView,
              page: currentPage,
              pageSize: 10,
            },
          ),
          getClientsForAppointmentForm(context, "admin-appointments-page"),
          getStaffPageData(context, "admin-appointments-page"),
        ]);

        return {
          appointments,
          hasMore,
          clients,
          allStaffMembers,
          allServices,
        };
      },
      (result) => ({
        appointmentCount: result.appointments.length,
        hasMore: result.hasMore,
        clientCount: result.clients.length,
        staffCount: result.allStaffMembers.length,
        serviceCount: result.allServices.length,
        view: selectedView,
        page: currentPage,
      }),
    );

  const formServices = allServices.filter((service) => service.is_active);
  const formStaffMembers = allStaffMembers
    .filter((staffMember) => staffMember.is_active)
    .map((staffMember) => ({
      ...staffMember,
      appointment_types: staffMember.appointment_types.filter(
        (service) => service.is_active,
      ),
    }))
    .filter((staffMember) => staffMember.appointment_types.length > 0);

  return (
    <AppointmentsClient
      appointments={appointments}
      clients={clients}
      currentPage={currentPage}
      hasMore={hasMore}
      selectedView={selectedView}
      services={formServices}
      serviceFilters={allServices}
      staffFilters={allStaffMembers}
      staffMembers={formStaffMembers}
      selectedDate={selectedDate}
      selectedAppointmentTypeId={selectedAppointmentTypeId}
      selectedStaffId={selectedStaffId}
      locale={locale}
    />
  );
}
