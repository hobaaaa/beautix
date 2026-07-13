import {
  APPOINTMENT_RACE_CONDITION_MESSAGE,
  buildDayRange,
  DEFAULT_SLOT_INTERVAL_MINUTES,
  getDayOfWeek,
  isOverlapConstraintError,
  isValidUuid,
  validateBookingWindowAndAvailability,
} from "@/lib/appointments/booking-validation";
import { combineDateAndTimeInTimezone } from "@/lib/slots/slot-engine";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  CustomerAuthRequiredError,
  getCustomerDashboardContext,
} from "../../../customer/queries";

type CreateCustomerAppointmentBody = {
  serviceId?: string;
  staffId?: string;
  date?: string;
  time?: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const context = await getCustomerDashboardContext();

    if (!context.selectedOrganization) {
      return jsonError("Randevu oluşturmak için işletme seçmelisiniz.", 400);
    }

    const body = (await request.json()) as CreateCustomerAppointmentBody;
    const serviceId = body.serviceId ?? "";
    const staffId = body.staffId ?? "";
    const date = body.date ?? "";
    const time = body.time ?? "";

    if (!isValidUuid(serviceId)) {
      return jsonError("Geçerli bir hizmet seçimi zorunludur.", 400);
    }

    if (!isValidUuid(staffId)) {
      return jsonError("Geçerli bir personel seçimi zorunludur.", 400);
    }

    if (!DATE_PATTERN.test(date)) {
      return jsonError("Geçerli bir tarih zorunludur.", 400);
    }

    if (!TIME_PATTERN.test(time)) {
      return jsonError("Geçerli bir saat seçimi zorunludur.", 400);
    }

    const supabase = await createSupabaseServerClient();
    const orgId = context.selectedOrganization.org_id;
    const clientId = context.selectedOrganization.client_id;
    const startAt = combineDateAndTimeInTimezone(date, time);

    if (startAt.getTime() <= Date.now()) {
      return jsonError("Geçmiş tarih veya saate randevu oluşturulamaz.", 400);
    }

    const [
      { data: client, error: clientError },
      { data: service, error: serviceError },
      { data: staff, error: staffError },
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id, is_active")
        .eq("id", clientId)
        .eq("org_id", orgId)
        .maybeSingle(),
      supabase
        .from("appointment_types")
        .select("id, duration_minutes, is_active")
        .eq("id", serviceId)
        .eq("org_id", orgId)
        .maybeSingle(),
      supabase
        .from("staff")
        .select("id, is_active")
        .eq("id", staffId)
        .eq("org_id", orgId)
        .maybeSingle(),
    ]);

    if (clientError || !client) {
      return jsonError("Müşteri kaydınız bulunamadı.", 400);
    }

    if (!client.is_active) {
      return jsonError("Pasif müşteri hesabıyla randevu oluşturulamaz.", 400);
    }

    if (serviceError || !service) {
      return jsonError("Seçilen hizmet bulunamadı.", 400);
    }

    if (!service.is_active) {
      return jsonError("Seçilen hizmet aktif değil.", 400);
    }

    if (!Number.isInteger(service.duration_minutes) || service.duration_minutes <= 0) {
      return jsonError("Seçilen hizmetin süresi geçersiz.", 400);
    }

    if (staffError || !staff) {
      return jsonError("Seçilen personel bulunamadı.", 400);
    }

    if (!staff.is_active) {
      return jsonError("Pasif personele randevu oluşturulamaz.", 400);
    }

    const dayOfWeek = getDayOfWeek(date);
    const { dayStart, nextDayStart } = buildDayRange(date);

    const [
      { data: mapping, error: mappingError },
      { data: workingHour, error: workingHourError },
      { data: appointments, error: appointmentsError },
    ] = await Promise.all([
      supabase
        .from("staff_appointment_types")
        .select("id")
        .eq("staff_id", staffId)
        .eq("appointment_type_id", serviceId)
        .maybeSingle(),
      supabase
        .from("working_hours")
        .select("start_time, end_time")
        .eq("org_id", orgId)
        .eq("day_of_week", dayOfWeek)
        .maybeSingle(),
      supabase.rpc("get_customer_staff_busy_appointments", {
        p_org_id: orgId,
        p_staff_id: staffId,
        p_day_start: dayStart,
        p_next_day_start: nextDayStart,
      }),
    ]);

    if (mappingError || !mapping) {
      return jsonError("Seçilen personel bu hizmeti veremiyor.", 400);
    }

    if (workingHourError) {
      return jsonError("Çalışma saatleri kontrol edilemedi.", 500);
    }

    if (appointmentsError) {
      return jsonError("Müsaitlik kontrol edilemedi.", 500);
    }

    const slotValidation = validateBookingWindowAndAvailability({
      appointments: appointments ?? [],
      date,
      selectedSlotStart: startAt.toISOString(),
      serviceDurationMinutes: service.duration_minutes,
      slotIntervalMinutes: DEFAULT_SLOT_INTERVAL_MINUTES,
      workingHours: workingHour,
    });

    if (!slotValidation.ok) {
      return jsonError(slotValidation.error, slotValidation.status);
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        org_id: orgId,
        client_id: clientId,
        appointment_type_id: serviceId,
        staff_id: staffId,
        start_at: startAt.toISOString(),
        end_at: slotValidation.endAt.toISOString(),
        status: "confirmed",
        notes: null,
      })
      .select("id")
      .single();

    if (error) {
      if (isOverlapConstraintError(error)) {
        return jsonError(APPOINTMENT_RACE_CONDITION_MESSAGE, 409);
      }

      return jsonError("Randevu oluşturulamadı.", 500);
    }

    const { error: notificationJobError } = await supabase.rpc(
      "enqueue_booking_confirmation_notification_job",
      {
        p_appointment_id: data.id,
      },
    );

    if (notificationJobError) {
      console.error("Error creating booking confirmation notification job:", {
        appointmentId: data.id,
        error: notificationJobError,
      });
    }

    const { error: reminderJobError } = await supabase.rpc(
      "enqueue_appointment_reminder_notification_job",
      {
        p_appointment_id: data.id,
      },
    );

    if (reminderJobError) {
      console.error("Error creating appointment reminder notification job:", {
        appointmentId: data.id,
        error: reminderJobError,
      });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof CustomerAuthRequiredError) {
      return jsonError("Oturum açmanız gerekiyor.", 401);
    }

    console.error("Error creating customer appointment:", error);
    return jsonError("Randevu oluşturulamadı.", 500);
  }
}
