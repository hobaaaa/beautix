import { apiError } from "@/lib/api/error-response";
import { isOverlapConstraintError } from "@/lib/appointments/booking-validation";
import {
  type GuestBookingFormValues,
  validateGuestBookingValues,
} from "@/lib/public-booking/guest-booking-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicBookingConfirmation } from "@/app/book/[slug]/queries";
import { NextRequest, NextResponse } from "next/server";

type PublicBookingBody = Partial<GuestBookingFormValues> & {
  slug?: string;
  serviceId?: string;
  staffId?: string;
  date?: string;
  time?: string;
};

function getFirstValidationError(errors: Record<string, string | undefined>) {
  return Object.values(errors).find((message) => typeof message === "string");
}

function isContactConflict(error: { message?: string }) {
  return error.message?.includes("public_booking_contact_conflict") === true;
}

function isSlotUnavailable(error: { code?: string; message?: string }) {
  return (
    isOverlapConstraintError(error) ||
    error.message?.includes("public_booking_slot_unavailable") === true ||
    error.message?.includes("public_booking_past") === true ||
    error.message?.includes("public_booking_closed") === true ||
    error.message?.includes("public_booking_outside_working_hours") === true
  );
}

function isNotFound(error: { message?: string }) {
  return error.message?.includes("public_booking_not_found") === true;
}

export async function POST(request: NextRequest) {
  let body: PublicBookingBody;

  try {
    body = (await request.json()) as PublicBookingBody;
  } catch {
    return apiError("Geçersiz istek gövdesi.", 400, "BAD_REQUEST");
  }

  const slug = typeof body.slug === "string" ? body.slug : "";
  const serviceId = typeof body.serviceId === "string" ? body.serviceId : "";
  const staffId = typeof body.staffId === "string" ? body.staffId : "";
  const date = typeof body.date === "string" ? body.date : "";
  const time = typeof body.time === "string" ? body.time : "";

  const guestValidation = validateGuestBookingValues({
    firstName: typeof body.firstName === "string" ? body.firstName : "",
    lastName: typeof body.lastName === "string" ? body.lastName : "",
    phone: typeof body.phone === "string" ? body.phone : "",
    email: typeof body.email === "string" ? body.email : "",
    notes: typeof body.notes === "string" ? body.notes : "",
    consent: body.consent === true,
  });

  if (!guestValidation.isValid) {
    return apiError(
      getFirstValidationError(guestValidation.errors) ?? "Bilgilerinizi kontrol edin.",
      400,
      "BAD_REQUEST",
    );
  }

  const bookingConfirmation = await getPublicBookingConfirmation({
    slug,
    serviceId,
    staffId,
    date,
    time,
  });

  if (!bookingConfirmation.organization) {
    return apiError("Randevu bağlantısı bulunamadı.", 404, "NOT_FOUND");
  }

  if (
    !bookingConfirmation.selectedService ||
    !bookingConfirmation.selectedDate ||
    !bookingConfirmation.selectedStaff
  ) {
    return apiError("Randevu seçiminizi kontrol edin.", 404, "NOT_FOUND");
  }

  if (!bookingConfirmation.selectedSlot) {
    return apiError(
      "Seçtiğiniz saat artık müsait değil. Lütfen başka bir saat seçin.",
      409,
      "CONFLICT",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_public_booking", {
    p_public_slug: bookingConfirmation.organization.public_slug,
    p_service_id: bookingConfirmation.selectedService.id,
    p_staff_id: bookingConfirmation.selectedStaff.id,
    p_date: bookingConfirmation.selectedDate,
    p_time: bookingConfirmation.selectedSlot.start_time,
    p_first_name: guestValidation.values.firstName,
    p_last_name: guestValidation.values.lastName,
    p_phone: guestValidation.values.phone,
    p_email: guestValidation.values.email,
    p_notes: guestValidation.values.notes,
  });

  if (error) {
    if (isSlotUnavailable(error)) {
      return apiError(
        "Seçtiğiniz saat artık müsait değil. Lütfen başka bir saat seçin.",
        409,
        "CONFLICT",
      );
    }

    if (isContactConflict(error)) {
      return apiError(
        "Bilgileriniz doğrulanamadı. Lütfen işletmeyle iletişime geçin.",
        409,
        "CONFLICT",
      );
    }

    if (isNotFound(error)) {
      return apiError("Randevu seçiminizi kontrol edin.", 404, "NOT_FOUND");
    }

    console.error("Public booking create failed:", error.code);
    return apiError("Randevu oluşturulamadı.", 500, "SERVER_ERROR");
  }

  const bookingId =
    Array.isArray(data) && typeof data[0]?.appointment_id === "string"
      ? data[0].appointment_id
      : null;

  if (!bookingId) {
    console.error("Public booking create returned empty result.");
    return apiError("Randevu oluşturulamadı.", 500, "SERVER_ERROR");
  }

  return NextResponse.json(
    {
      success: true,
      bookingId,
    },
    { status: 201 },
  );
}
