import {
  APPOINTMENT_RACE_CONDITION_MESSAGE,
  buildDayRange,
  DEFAULT_SLOT_INTERVAL_MINUTES,
  isOverlapConstraintError,
  isValidUuid,
  parseBookingStart,
  validateBookingWindowAndAvailability,
} from "@/lib/appointments/booking-validation";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { NextRequest, NextResponse } from "next/server";

type UpdateAppointmentBody = {
  status?: string;
  client_id?: string;
  appointment_type_id?: string;
  staff_id?: string;
  selected_slot_start?: string;
  notes?: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id || !isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir randevu kimliği zorunludur." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as UpdateAppointmentBody;
    const { supabase, orgId } = await getCurrentOrgContext();

    if (body.status === "cancelled") {
      const { data, error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("org_id", orgId)
        .eq("status", "confirmed")
        .select("id, status")
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json(
          { success: false, error: "Bu randevu artık iptal edilemiyor." },
          { status: error ? 500 : 409 },
        );
      }

      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    const { client_id, appointment_type_id, staff_id, selected_slot_start, notes } = body;

    if (!client_id || !isValidUuid(client_id)) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir müşteri seçimi zorunludur." },
        { status: 400 },
      );
    }

    if (!appointment_type_id || !isValidUuid(appointment_type_id)) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir hizmet seçimi zorunludur." },
        { status: 400 },
      );
    }

    if (!staff_id || !isValidUuid(staff_id)) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir personel seçimi zorunludur." },
        { status: 400 },
      );
    }

    if (!selected_slot_start) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir saat seçimi zorunludur." },
        { status: 400 },
      );
    }

    const { data: existingAppointment, error: existingAppointmentError } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();

    if (existingAppointmentError || !existingAppointment) {
      return NextResponse.json(
        { success: false, error: "Randevu bulunamadı." },
        { status: 404 },
      );
    }

    if (existingAppointment.status !== "confirmed") {
      return NextResponse.json(
        { success: false, error: "Bu randevu düzenlenemez." },
        { status: 400 },
      );
    }

    const parsedStart = parseBookingStart(
      selected_slot_start,
      "Geçmiş tarih veya saate randevu taşınamaz.",
    );

    if (!parsedStart.ok) {
      return NextResponse.json(
        { success: false, error: parsedStart.error },
        { status: parsedStart.status },
      );
    }

    const { appointmentDate, dayOfWeek, startAt } = parsedStart;

    const [
      { data: client, error: clientError },
      { data: appointmentType, error: appointmentTypeError },
      { data: staff, error: staffError },
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id, is_active")
        .eq("id", client_id)
        .eq("org_id", orgId)
        .single(),
      supabase
        .from("appointment_types")
        .select("id, duration_minutes, is_active")
        .eq("id", appointment_type_id)
        .eq("org_id", orgId)
        .single(),
      supabase
        .from("staff")
        .select("id, is_active")
        .eq("id", staff_id)
        .eq("org_id", orgId)
        .single(),
    ]);

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: "Seçilen müşteri bulunamadı." },
        { status: 400 },
      );
    }

    if (!client.is_active) {
      return NextResponse.json(
        { success: false, error: "Pasif müşteri için randevu güncellenemez." },
        { status: 400 },
      );
    }

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

    if (!Number.isInteger(appointmentType.duration_minutes) || appointmentType.duration_minutes <= 0) {
      return NextResponse.json(
        { success: false, error: "Seçilen hizmetin süresi geçersiz." },
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
        { success: false, error: "Pasif personel için randevu düzenlenemez." },
        { status: 400 },
      );
    }

    const { dayStart, nextDayStart } = buildDayRange(appointmentDate);

    const [
      { data: staffServiceMapping, error: mappingError },
      { data: workingHour, error: workingHourError },
      { data: appointments, error: appointmentsError },
    ] = await Promise.all([
      supabase
        .from("staff_appointment_types")
        .select("id")
        .eq("staff_id", staff_id)
        .eq("appointment_type_id", appointment_type_id)
        .maybeSingle(),
      supabase
        .from("working_hours")
        .select("start_time, end_time")
        .eq("org_id", orgId)
        .eq("day_of_week", dayOfWeek)
        .maybeSingle(),
      supabase
        .from("appointments")
        .select("start_at, end_at, status")
        .eq("org_id", orgId)
        .eq("staff_id", staff_id)
        .neq("id", id)
        .neq("status", "cancelled")
        .gte("start_at", dayStart)
        .lt("start_at", nextDayStart),
    ]);

    if (mappingError || !staffServiceMapping) {
      return NextResponse.json(
        { success: false, error: "Seçilen personel bu hizmeti veremiyor." },
        { status: 400 },
      );
    }

    if (workingHourError) {
      return NextResponse.json(
        { success: false, error: "Çalışma saatleri kontrol edilemedi." },
        { status: 500 },
      );
    }

    if (appointmentsError) {
      return NextResponse.json(
        { success: false, error: "Müsaitlik kontrol edilemedi." },
        { status: 500 },
      );
    }

    const slotValidation = validateBookingWindowAndAvailability({
      appointments: appointments ?? [],
      date: appointmentDate,
      selectedSlotStart: startAt.toISOString(),
      serviceDurationMinutes: appointmentType.duration_minutes,
      slotIntervalMinutes: DEFAULT_SLOT_INTERVAL_MINUTES,
      workingHours: workingHour,
    });

    if (!slotValidation.ok) {
      return NextResponse.json(
        { success: false, error: slotValidation.error },
        { status: slotValidation.status },
      );
    }

    const { data, error } = await supabase
      .from("appointments")
      .update({
        client_id,
        appointment_type_id,
        staff_id,
        start_at: startAt.toISOString(),
        end_at: slotValidation.endAt.toISOString(),
        notes: notes?.trim() ? notes.trim() : null,
      })
      .eq("id", id)
      .eq("org_id", orgId)
      .select("id")
      .single();

    if (error) {
      if (isOverlapConstraintError(error)) {
        return NextResponse.json(
          { success: false, error: APPOINTMENT_RACE_CONDITION_MESSAGE },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { success: false, error: "Randevu güncellenemedi." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { success: false, error: "Randevu güncellenemedi." },
      { status: 500 },
    );
  }
}

