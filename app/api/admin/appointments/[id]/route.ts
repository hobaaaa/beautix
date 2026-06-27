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

const ISTANBUL_OFFSET = "+03:00";
const APPOINTMENT_OVERLAP_MESSAGE =
  "Bu personelin bu saat aralığı dolu. Lütfen başka bir saat seçin.";

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getDayOfWeek(date: string) {
  const value = new Date(`${date}T12:00:00${ISTANBUL_OFFSET}`);
  const day = value.getUTCDay();
  return day === 0 ? 7 : day;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function formatDateInIstanbul(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function formatTimeInIstanbul(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function isOverlapConstraintError(error: { code?: string; message?: string }) {
  return (
    error.code === "23P01" ||
    error.message?.includes("appointments_no_overlap") ||
    error.message?.includes("appointments_no_overlap_by_staff") ||
    error.message?.toLowerCase().includes("exclusion constraint")
  );
}

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
        .select("id, status")
        .single();

      if (error || !data) {
        return NextResponse.json(
          { success: false, error: "Randevu iptal edilemedi." },
          { status: 500 },
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

    if (existingAppointment.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "İptal edilmiş randevu düzenlenemez." },
        { status: 400 },
      );
    }

    const startAt = new Date(selected_slot_start);

    if (Number.isNaN(startAt.getTime())) {
      return NextResponse.json(
        { success: false, error: "Seçilen saat geçersiz." },
        { status: 400 },
      );
    }

    if (startAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { success: false, error: "Geçmiş tarih veya saate randevu taşınamaz." },
        { status: 400 },
      );
    }

    const appointmentDate = formatDateInIstanbul(startAt.toISOString());
    const startTime = formatTimeInIstanbul(startAt.toISOString());
    const dayOfWeek = getDayOfWeek(appointmentDate);

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", client_id)
      .eq("org_id", orgId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: "Seçilen müşteri bulunamadı." },
        { status: 400 },
      );
    }

    const { data: appointmentType, error: appointmentTypeError } = await supabase
      .from("appointment_types")
      .select("id, duration_minutes, is_active")
      .eq("id", appointment_type_id)
      .eq("org_id", orgId)
      .single();

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

    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("id, is_active")
      .eq("id", staff_id)
      .eq("org_id", orgId)
      .single();

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

    const { data: staffServiceMapping, error: mappingError } = await supabase
      .from("staff_appointment_types")
      .select("id")
      .eq("staff_id", staff_id)
      .eq("appointment_type_id", appointment_type_id)
      .maybeSingle();

    if (mappingError || !staffServiceMapping) {
      return NextResponse.json(
        { success: false, error: "Seçilen personel bu hizmeti veremiyor." },
        { status: 400 },
      );
    }

    const { data: workingHour, error: workingHourError } = await supabase
      .from("working_hours")
      .select("day_of_week, start_time, end_time")
      .eq("org_id", orgId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();

    if (workingHourError) {
      return NextResponse.json(
        { success: false, error: "Çalışma saatleri kontrol edilemedi." },
        { status: 500 },
      );
    }

    if (!workingHour) {
      return NextResponse.json(
        { success: false, error: "Kapalı günde randevu güncellenemez." },
        { status: 400 },
      );
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + appointmentType.duration_minutes;
    const workingStartMinutes = timeToMinutes(workingHour.start_time);
    const workingEndMinutes = timeToMinutes(workingHour.end_time);

    if (startMinutes < workingStartMinutes || startMinutes >= workingEndMinutes) {
      return NextResponse.json(
        { success: false, error: "Seçilen saat çalışma saatleri dışında kalıyor." },
        { status: 400 },
      );
    }

    if (endMinutes > workingEndMinutes) {
      return NextResponse.json(
        { success: false, error: "Randevu mesai bitiş saatini aşıyor." },
        { status: 400 },
      );
    }

    const endAt = new Date(startAt.getTime() + appointmentType.duration_minutes * 60000);

    const { data: conflictingAppointment, error: conflictingAppointmentError } = await supabase
      .from("appointments")
      .select("id")
      .eq("org_id", orgId)
      .eq("staff_id", staff_id)
      .neq("id", id)
      .neq("status", "cancelled")
      .lt("start_at", endAt.toISOString())
      .gt("end_at", startAt.toISOString())
      .maybeSingle();

    if (conflictingAppointmentError) {
      return NextResponse.json(
        { success: false, error: "Randevu çakışması kontrol edilemedi." },
        { status: 500 },
      );
    }

    if (conflictingAppointment) {
      return NextResponse.json(
        { success: false, error: APPOINTMENT_OVERLAP_MESSAGE },
        { status: 409 },
      );
    }

    const { data, error } = await supabase
      .from("appointments")
      .update({
        client_id,
        appointment_type_id,
        staff_id,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        notes: notes?.trim() ? notes.trim() : null,
      })
      .eq("id", id)
      .eq("org_id", orgId)
      .select("id")
      .single();

    if (error) {
      if (isOverlapConstraintError(error)) {
        return NextResponse.json(
          { success: false, error: APPOINTMENT_OVERLAP_MESSAGE },
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
