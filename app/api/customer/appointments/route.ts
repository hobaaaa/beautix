import {
  API_ERROR_MESSAGES,
  apiError,
} from "@/lib/api/error-response";
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

export async function POST(request: NextRequest) {
  try {
    const context = await getCustomerDashboardContext();

    if (!context.selectedOrganization) {
      return apiError("Randevu oluşturmak için işletme seçmelisiniz.", 400, "BAD_REQUEST");
    }

    const body = (await request.json()) as CreateCustomerAppointmentBody;
    const serviceId = body.serviceId ?? "";
    const staffId = body.staffId ?? "";
    const date = body.date ?? "";
    const time = body.time ?? "";

    if (!isValidUuid(serviceId)) {
      return apiError("Geçerli bir hizmet seçimi zorunludur.", 400, "BAD_REQUEST");
    }

    if (!isValidUuid(staffId)) {
      return apiError("Geçerli bir personel seçimi zorunludur.", 400, "BAD_REQUEST");
    }

    if (!DATE_PATTERN.test(date)) {
      return apiError("Geçerli bir tarih zorunludur.", 400, "BAD_REQUEST");
    }

    if (!TIME_PATTERN.test(time)) {
      return apiError("Geçerli bir saat seçimi zorunludur.", 400, "BAD_REQUEST");
    }

    const supabase = await createSupabaseServerClient();
    const orgId = context.selectedOrganization.org_id;
    const clientId = context.selectedOrganization.client_id;
    const startAt = combineDateAndTimeInTimezone(date, time);

    if (startAt.getTime() <= Date.now()) {
      return apiError("Geçmiş tarih veya saate randevu oluşturulamaz.", 422, "VALIDATION_ERROR");
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
      return apiError("Müşteri kaydınız bulunamadı.", 404, "NOT_FOUND");
    }

    if (!client.is_active) {
      return apiError("Pasif müşteri hesabıyla randevu oluşturulamaz.", 422, "VALIDATION_ERROR");
    }

    if (serviceError || !service) {
      return apiError("Seçilen hizmet bulunamadı.", 404, "NOT_FOUND");
    }

    if (!service.is_active) {
      return apiError("Seçilen hizmet aktif değil.", 422, "VALIDATION_ERROR");
    }

    if (!Number.isInteger(service.duration_minutes) || service.duration_minutes <= 0) {
      return apiError("Seçilen hizmetin süresi geçersiz.", 422, "VALIDATION_ERROR");
    }

    if (staffError || !staff) {
      return apiError("Seçilen personel bulunamadı.", 404, "NOT_FOUND");
    }

    if (!staff.is_active) {
      return apiError("Pasif personele randevu oluşturulamaz.", 422, "VALIDATION_ERROR");
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
      return apiError("Seçilen personel bu hizmeti veremiyor.", 422, "VALIDATION_ERROR");
    }

    if (workingHourError) {
      return apiError(API_ERROR_MESSAGES.generic, 500, "SERVER_ERROR");
    }

    if (appointmentsError) {
      return apiError(API_ERROR_MESSAGES.generic, 500, "SERVER_ERROR");
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
      return apiError(slotValidation.error, slotValidation.status, "VALIDATION_ERROR");
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
        return apiError(APPOINTMENT_RACE_CONDITION_MESSAGE, 409, "CONFLICT");
      }

      return apiError("Randevu oluşturulamadı.", 500, "SERVER_ERROR");
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

    const { error: businessNotificationJobError } = await supabase.rpc(
      "enqueue_business_booking_notification_job",
      {
        p_appointment_id: data.id,
      },
    );

    if (businessNotificationJobError) {
      console.error("Error creating business booking notification job:", {
        appointmentId: data.id,
        error: businessNotificationJobError,
      });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof CustomerAuthRequiredError) {
      return apiError(API_ERROR_MESSAGES.unauthorized, 401, "UNAUTHORIZED");
    }

    console.error("Error creating customer appointment:", error);
    return apiError("Randevu oluşturulamadı.", 500, "SERVER_ERROR");
  }
}

