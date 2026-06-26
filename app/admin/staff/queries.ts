import "server-only";

import { logServerTiming } from "@/lib/perf";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import type { OrgContext } from "@/lib/supabase/org";
import { Service, Staff, StaffListItem } from "../../../types";

type StaffAppointmentTypeRow = {
  staff_id: string;
  appointment_type_id: string;
};

export async function getStaffPageData(
  context?: OrgContext,
  logLabel = "admin-staff-page",
): Promise<{
  staff: StaffListItem[];
  services: Service[];
}> {
  const { supabase, orgId } = context ?? (await getCurrentOrgContext(logLabel));
  const initialQueryStart = Date.now();

  const [{ data: staffRows, error: staffError }, { data: services, error: serviceError }] =
    await Promise.all([
      supabase
        .from("staff")
        .select("id, org_id, name, is_active, created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false }),
      supabase
        .from("appointment_types")
        .select("id, name, duration_minutes, is_active, created_at, org_id")
        .eq("org_id", orgId)
        .order("name", { ascending: true }),
    ]);

  if (staffError) {
    throw staffError;
  }

  if (serviceError) {
    throw serviceError;
  }

  logServerTiming(logLabel, "staff.initial-queries", Date.now() - initialQueryStart, {
    staffCount: staffRows?.length ?? 0,
    serviceCount: services?.length ?? 0,
  });

  const staffIds = (staffRows ?? []).map((item) => item.id);
  let mappingRows: StaffAppointmentTypeRow[] = [];

  if (staffIds.length > 0) {
    const mappingQueryStart = Date.now();
    const { data: mappings, error: mappingError } = await supabase
      .from("staff_appointment_types")
      .select("staff_id, appointment_type_id")
      .in("staff_id", staffIds);

    if (mappingError) {
      throw mappingError;
    }

    mappingRows = (mappings ?? []) as StaffAppointmentTypeRow[];
    logServerTiming(logLabel, "staff.mappings-query", Date.now() - mappingQueryStart, {
      mappingCount: mappingRows.length,
    });
  }

  const servicesById = new Map((services ?? []).map((service) => [service.id, service]));
  const mappingsByStaffId = new Map<string, Service[]>();

  for (const mapping of mappingRows) {
    const service = servicesById.get(mapping.appointment_type_id);
    if (!service) continue;

    const current = mappingsByStaffId.get(mapping.staff_id) ?? [];
    current.push(service);
    mappingsByStaffId.set(mapping.staff_id, current);
  }

  const staff = ((staffRows ?? []) as Staff[]).map((staffMember) => ({
    ...staffMember,
    appointment_types: (mappingsByStaffId.get(staffMember.id) ?? []).sort((a, b) =>
      a.name.localeCompare(b.name, "tr"),
    ),
  }));

  return {
    staff,
    services: (services ?? []) as Service[],
  };
}

export async function getStaffForAppointmentForm(): Promise<{
  data: StaffListItem[];
}> {
  const { staff } = await getStaffPageData();

  return {
    data: staff
      .filter((staffMember) => staffMember.is_active)
      .map((staffMember) => ({
        ...staffMember,
        appointment_types: staffMember.appointment_types.filter(
          (service) => service.is_active,
        ),
      }))
      .filter((staffMember) => staffMember.appointment_types.length > 0),
  };
}
