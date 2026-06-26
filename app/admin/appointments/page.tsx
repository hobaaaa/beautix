import { measureServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { getStaffPageData } from "../staff/queries";
import { AppointmentsClient } from "./AppointmentsClient";
import { getAppointmentsByDate, getClientsForAppointmentForm } from "./queries";

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

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    date?: string;
    appointmentTypeId?: string;
    staffId?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const selectedDate = isValidDate(params.date)
    ? params.date!
    : getTodayInIstanbul();
  const selectedAppointmentTypeId: string = isValidUuid(params.appointmentTypeId)
    ? params.appointmentTypeId!
    : "";
  const selectedStaffId: string = isValidUuid(params.staffId) ? params.staffId! : "";

  const { appointments, clients, allStaffMembers, allServices } = await measureServerTiming(
    "admin-appointments-page",
    "page.total",
    async () => {
      const context = await getCurrentOrgContext("admin-appointments-page");
      const [
        { data: appointments },
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
        ),
        getClientsForAppointmentForm(context, "admin-appointments-page"),
        getStaffPageData(context, "admin-appointments-page"),
      ]);

      return {
        appointments,
        clients,
        allStaffMembers,
        allServices,
      };
    },
    (result) => ({
      appointmentCount: result.appointments.length,
      clientCount: result.clients.length,
      staffCount: result.allStaffMembers.length,
      serviceCount: result.allServices.length,
    }),
  );

  const formServices = allServices.filter((service) => service.is_active);
  const formStaffMembers = allStaffMembers
    .filter((staffMember) => staffMember.is_active)
    .map((staffMember) => ({
      ...staffMember,
      appointment_types: staffMember.appointment_types.filter((service) => service.is_active),
    }))
    .filter((staffMember) => staffMember.appointment_types.length > 0);

  return (
    <AppointmentsClient
      appointments={appointments}
      clients={clients}
      services={formServices}
      staffMembers={formStaffMembers}
      serviceFilters={allServices}
      staffFilters={allStaffMembers}
      selectedDate={selectedDate}
      selectedAppointmentTypeId={selectedAppointmentTypeId}
      selectedStaffId={selectedStaffId}
    />
  );
}
