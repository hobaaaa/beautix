import { getAvailableSlots } from "@/lib/slots/availability-engine";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { NextRequest, NextResponse } from "next/server";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getDayOfWeek(date: string) {
  const value = new Date(`${date}T12:00:00+03:00`);
  const day = value.getUTCDay();
  return day === 0 ? 7 : day;
}

function buildDayRange(date: string) {
  const dayStart = new Date(`${date}T00:00:00+03:00`);
  const nextDayStart = new Date(dayStart);
  nextDayStart.setDate(nextDayStart.getDate() + 1);

  return {
    dayStart: dayStart.toISOString(),
    nextDayStart: nextDayStart.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, orgId } = await getCurrentOrgContext();
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") ?? "";
    const appointmentTypeId = searchParams.get("appointmentTypeId") ?? "";
    const staffId = searchParams.get("staffId") ?? "";
    const excludeAppointmentId = searchParams.get("excludeAppointmentId") ?? "";

    if (!DATE_PATTERN.test(date)) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir tarih zorunludur." },
        { status: 400 },
      );
    }

    if (!appointmentTypeId || !isValidUuid(appointmentTypeId)) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir hizmet seçimi zorunludur." },
        { status: 400 },
      );
    }

    if (!staffId || !isValidUuid(staffId)) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir personel seçimi zorunludur." },
        { status: 400 },
      );
    }

    if (excludeAppointmentId && !isValidUuid(excludeAppointmentId)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz randevu kimliği." },
        { status: 400 },
      );
    }

    const dayOfWeek = getDayOfWeek(date);

    const [{ data: appointmentType, error: appointmentTypeError }, { data: staff, error: staffError }] =
      await Promise.all([
        supabase
          .from("appointment_types")
          .select("id, duration_minutes, is_active")
          .eq("id", appointmentTypeId)
          .eq("org_id", orgId)
          .single(),
        supabase
          .from("staff")
          .select("id, is_active")
          .eq("id", staffId)
          .eq("org_id", orgId)
          .single(),
      ]);

    if (appointmentTypeError || !appointmentType) {
      return NextResponse.json(
        { success: false, error: "Seçilen hizmet bulunamadı." },
        { status: 400 },
      );
    }

    if (!appointmentType.is_active) {
      return NextResponse.json(
        { success: false, error: "Seçilen hizmet aktif değil." },
        { status: 400 },
      );
    }

    if (staffError || !staff) {
      return NextResponse.json(
        { success: false, error: "Seçilen personel bulunamadı." },
        { status: 400 },
      );
    }

    if (!staff.is_active) {
      return NextResponse.json(
        { success: false, error: "Pasif personel için müsait saat alınamaz." },
        { status: 400 },
      );
    }

    const { data: staffServiceMapping, error: mappingError } = await supabase
      .from("staff_appointment_types")
      .select("id")
      .eq("staff_id", staffId)
      .eq("appointment_type_id", appointmentTypeId)
      .maybeSingle();

    if (mappingError || !staffServiceMapping) {
      return NextResponse.json(
        { success: false, error: "Seçilen personel bu hizmeti veremiyor." },
        { status: 400 },
      );
    }

    const { data: workingHour, error: workingHourError } = await supabase
      .from("working_hours")
      .select("start_time, end_time")
      .eq("org_id", orgId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();

    if (workingHourError) {
      return NextResponse.json(
        { success: false, error: "Müsait saatler yüklenemedi." },
        { status: 500 },
      );
    }

    if (!workingHour) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const { dayStart, nextDayStart } = buildDayRange(date);

    let appointmentsQuery = supabase
      .from("appointments")
      .select("start_at, end_at, status")
      .eq("org_id", orgId)
      .eq("staff_id", staffId)
      .gte("start_at", dayStart)
      .lt("start_at", nextDayStart);

    if (excludeAppointmentId) {
      appointmentsQuery = appointmentsQuery.neq("id", excludeAppointmentId);
    }

    const { data: appointments, error: appointmentsError } = await appointmentsQuery;

    if (appointmentsError) {
      return NextResponse.json(
        { success: false, error: "Müsait saatler yüklenemedi." },
        { status: 500 },
      );
    }

    const slots = getAvailableSlots({
      date,
      workingHours: workingHour,
      appointments: appointments ?? [],
      serviceDurationMinutes: appointmentType.duration_minutes,
    });

    return NextResponse.json({ success: true, data: slots }, { status: 200 });
  } catch (error) {
    console.error("Error loading available slots:", error);
    return NextResponse.json(
      { success: false, error: "Müsait saatler yüklenemedi." },
      { status: 500 },
    );
  }
}
