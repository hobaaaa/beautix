import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CUSTOMER_ORG_COOKIE } from "@/app/customer/queries";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { success: false, error: "Çıkış yapılırken bir hata oluştu." },
        { status: 500 },
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(CUSTOMER_ORG_COOKIE, "", {
      path: "/customer",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Customer logout failed:", error);
    return NextResponse.json(
      { success: false, error: "Çıkış yapılırken bir hata oluştu." },
      { status: 500 },
    );
  }
}
