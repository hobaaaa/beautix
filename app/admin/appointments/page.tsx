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
  searchParams?: {
    date?: string;
    appointmentTypeId?: string;
    staffId?: string;
  };
}) {
  const params = searchParams ?? {};
  const selectedDate = isValidDate(params.date)
    ? params.date!
    : getTodayInIstanbul();
  const selectedAppointmentTypeId: string = isValidUuid(params.appointmentTypeId)
    ? params.appointmentTypeId!
    : "";
  const selectedStaffId: string = isValidUuid(params.staffId) ? params.staffId! : "";

  const [
    { data: appointments },
    { data: clients },
    { staff: allStaffMembers, services: allServices },
  ] = await Promise.all([
    getAppointmentsByDate(selectedDate, {
      appointmentTypeId: selectedAppointmentTypeId || undefined,
      staffId: selectedStaffId || undefined,
    }),
    getClientsForAppointmentForm(),
    getStaffPageData(),
  ]);

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
