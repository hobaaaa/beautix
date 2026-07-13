import { isValidUuid } from "@/lib/appointments/booking-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  CustomerAuthRequiredError,
  getCustomerDashboardContext,
} from "../../../../../customer/queries";

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  try {
    const { appointmentId } = await params;

    if (!isValidUuid(appointmentId)) {
      return jsonError("Geçersiz randevu kimliği.", 400);
    }

    const context = await getCustomerDashboardContext();

    if (!context.selectedOrganization) {
      return jsonError("Randevu iptali için işletme seçmelisiniz.", 400);
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("cancel_customer_appointment", {
      p_appointment_id: appointmentId,
      p_org_id: context.selectedOrganization.org_id,
    });

    if (error) {
      console.error("Customer appointment cancel failed:", error);
      return jsonError("Randevu iptal edilemedi.", 500);
    }

    if (data !== "cancelled") {
      return jsonError("Bu randevu artık iptal edilemiyor.", 409);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof CustomerAuthRequiredError) {
      return jsonError("Oturum açmanız gerekiyor.", 401);
    }

    console.error("Error cancelling customer appointment:", error);
    return jsonError("Randevu iptal edilemedi.", 500);
  }
}
