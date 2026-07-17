import { isValidUuid } from "@/lib/appointments/booking-validation";
import {
  API_ERROR_MESSAGES,
  apiError,
} from "@/lib/api/error-response";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  CustomerAuthRequiredError,
  getCustomerDashboardContext,
} from "../../../../../customer/queries";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  try {
    const { appointmentId } = await params;

    if (!isValidUuid(appointmentId)) {
      return apiError("Geçersiz randevu kimliği.", 400, "BAD_REQUEST");
    }

    const context = await getCustomerDashboardContext();

    if (!context.selectedOrganization) {
      return apiError("Randevu iptali için işletme seçmelisiniz.", 400, "BAD_REQUEST");
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("cancel_customer_appointment", {
      p_appointment_id: appointmentId,
      p_org_id: context.selectedOrganization.org_id,
    });

    if (error) {
      console.error("Customer appointment cancel failed:", error);
      return apiError("Randevu iptal edilemedi.", 500, "SERVER_ERROR");
    }

    if (data !== "cancelled") {
      return apiError("Bu randevu artık iptal edilemiyor.", 409, "CONFLICT");
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof CustomerAuthRequiredError) {
      return apiError(API_ERROR_MESSAGES.unauthorized, 401, "UNAUTHORIZED");
    }

    console.error("Error cancelling customer appointment:", error);
    return apiError("Randevu iptal edilemedi.", 500, "SERVER_ERROR");
  }
}

