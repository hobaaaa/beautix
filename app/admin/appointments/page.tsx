import { AppointmentsClient } from "./AppointmentsClient";
import {
  getAppointmentsByDate,
  getClientsForAppointmentForm,
  getServicesForAppointmentForm,
} from "./queries";

function getTodayInIstanbul() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date());
}

function isValidDate(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const selectedDate = isValidDate(params.date)
    ? params.date!
    : getTodayInIstanbul();

  const [
    { data: appointments },
    { data: clients },
    { data: services },
  ] = await Promise.all([
    getAppointmentsByDate(selectedDate),
    getClientsForAppointmentForm(),
    getServicesForAppointmentForm(),
  ]);

  return (
    <AppointmentsClient
      appointments={appointments}
      clients={clients}
      services={services}
      selectedDate={selectedDate}
    />
  );
}
