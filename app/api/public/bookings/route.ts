import { apiError } from "@/lib/api/error-response";
import { isOverlapConstraintError } from "@/lib/appointments/booking-validation";
import {
  type GuestBookingFormValues,
  validateGuestBookingValues,
} from "@/lib/public-booking/guest-booking-schema";
import {
  createPublicBookingContactHashes,
  createPublicBookingIpHash,
  getPublicBookingRateLimitSecret,
  isValidPublicBookingStartedAt,
  PUBLIC_BOOKING_RATE_LIMIT_MESSAGE,
} from "@/lib/public-booking/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getPublicBookingConfirmation,
  getPublicOrganizationBySlug,
} from "@/app/book/[slug]/queries";
import { NextRequest, NextResponse } from "next/server";

type PublicBookingBody = Partial<GuestBookingFormValues> & {
  slug?: string;
  serviceId?: string;
  staffId?: string;
  date?: string;
  time?: string;
  website?: string;
  startedAt?: string;
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

function rateLimitErrorResponse() {
  return NextResponse.json(
    {
      success: false,
      error: PUBLIC_BOOKING_RATE_LIMIT_MESSAGE,
    },
    {
      status: 429,
      headers: {
        "Retry-After": "600",
      },
    },
  );
}

async function checkPublicBookingRateLimit({
  orgId,
  ipHash,
  contactHashes,
}: {
  orgId: string;
  ipHash: string;
  contactHashes: string[];
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("check_public_booking_rate_limit", {
    p_org_id: orgId,
    p_ip_hash: ipHash,
    p_contact_hashes: contactHashes,
  });

  if (error) {
    console.error("Public booking rate limit check failed:", error.code);
    throw error;
  }

  const result = Array.isArray(data) ? data[0] : null;
  const allowed = result?.allowed === true;
  const reasonCode =
    typeof result?.reason_code === "string" ? result.reason_code : null;

  if (!allowed && reasonCode) {
    console.info("Public booking blocked:", reasonCode);
  }

  return allowed;
}

async function recordPublicBookingSuccessAttempt({
  orgId,
  ipHash,
  contactHashes,
}: {
  orgId: string;
  ipHash: string;
  contactHashes: string[];
}) {
  const rows = contactHashes.map((contactHash) => ({
    org_id: orgId,
    ip_hash: ipHash,
    contact_hash: contactHash,
    outcome: "success",
  }));

  if (rows.length === 0) {
    return;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("public_booking_attempts").insert(rows);

    if (error) {
      console.error("Public booking success attempt log failed:", error.code);
    }
  } catch {
    console.error("Public booking success attempt log failed.");
  }
}

export async function POST(request: NextRequest) {
  let body: PublicBookingBody;
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (Number.isFinite(contentLength) && contentLength > 20_000) {
    return apiError("İstek gövdesi çok büyük.", 413);
  }

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

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return apiError("Bilgilerinizi kontrol edin.", 422, "VALIDATION_ERROR");
  }

  if (!isValidPublicBookingStartedAt(body.startedAt)) {
    return apiError("Bilgilerinizi kontrol edin.", 422, "VALIDATION_ERROR");
  }

  const organization = await getPublicOrganizationBySlug(slug);

  if (!organization) {
    return apiError("Randevu baÄŸlantÄ±sÄ± bulunamadÄ±.", 404, "NOT_FOUND");
  }

  const rateLimitSecret = getPublicBookingRateLimitSecret();

  if (!rateLimitSecret) {
    console.error("Public booking rate limit secret is missing.");
    return apiError("Randevu oluÅŸturulamadÄ±.", 500, "SERVER_ERROR");
  }

  const ipHash = createPublicBookingIpHash(request, rateLimitSecret);
  const contactHashes = createPublicBookingContactHashes({
    email: guestValidation.values.email,
    phone: guestValidation.values.phone,
    secret: rateLimitSecret,
  });

  let rateLimitAllowed = false;

  try {
    rateLimitAllowed = await checkPublicBookingRateLimit({
      orgId: organization.id,
      ipHash,
      contactHashes,
    });
  } catch {
    return apiError("Randevu oluÅŸturulamadÄ±.", 500, "SERVER_ERROR");
  }

  if (!rateLimitAllowed) {
    return rateLimitErrorResponse();
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

  await recordPublicBookingSuccessAttempt({
    orgId: organization.id,
    ipHash,
    contactHashes,
  });

  return NextResponse.json(
    {
      success: true,
      bookingId,
    },
    { status: 201 },
  );
}
