import { apiError } from "@/lib/api/error-response";
import { isValidUuid } from "@/lib/appointments/booking-validation";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { NextRequest, NextResponse } from "next/server";

type UpdateAppointmentStatusBody = {
  status?: string;
};

function isLifecycleStatus(value: string): value is "completed" | "no_show" {
  return value === "completed" || value === "no_show";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!isValidUuid(id)) {
      return apiError("Geçersiz randevu kimliği.", 400, "BAD_REQUEST");
    }

    const body = (await request.json()) as UpdateAppointmentStatusBody;
    const nextStatus = body.status ?? "";

    if (!isLifecycleStatus(nextStatus)) {
      return apiError("Geçersiz randevu durumu.", 400, "BAD_REQUEST");
    }

    const { supabase, orgId } = await getCurrentOrgContext();
    const { data, error } = await supabase
      .from("appointments")
      .update({ status: nextStatus })
      .eq("id", id)
      .eq("org_id", orgId)
      .eq("status", "confirmed")
      .lte("start_at", new Date().toISOString())
      .select("id, status")
      .maybeSingle();

    if (error) {
      console.error("Admin appointment lifecycle update failed:", error);
      return apiError("Randevu durumu güncellenemedi.", 500, "SERVER_ERROR");
    }

    if (!data) {
      return apiError(
        "Bu randevunun durumu artık değiştirilemiyor.",
        409,
        "CONFLICT",
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Error updating appointment lifecycle status:", error);
    return apiError("Randevu durumu güncellenemedi.", 500, "SERVER_ERROR");
  }
}

