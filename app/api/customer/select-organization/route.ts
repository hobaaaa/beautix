import { CUSTOMER_ORG_COOKIE, isValidOrganizationId } from "@/app/customer/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type SelectOrganizationBody = {
  org_id?: string;
};

type CustomerOrganizationRow = {
  org_id: string;
};

function normalizeOrganizations(value: unknown): CustomerOrganizationRow[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is CustomerOrganizationRow =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).org_id === "string",
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SelectOrganizationBody;

    if (!body.org_id || !isValidOrganizationId(body.org_id)) {
      return NextResponse.json(
        { success: false, error: "İşletme bilgisi geçersiz." },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Oturum doğrulanamadı." },
        { status: 401 },
      );
    }

    const { data, error } = await supabase.rpc("link_customer_clients");

    if (error) {
      console.error("Customer organization select RPC failed:", error.code);
      return NextResponse.json(
        { success: false, error: "İşletme bilgisi doğrulanamadı." },
        { status: 500 },
      );
    }

    const organizations = normalizeOrganizations(data);
    const organization = organizations.find((item) => item.org_id === body.org_id);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Bu işletmeye erişim yetkiniz yok." },
        { status: 403 },
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(CUSTOMER_ORG_COOKIE, body.org_id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/customer",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Customer organization select failed:", error);
    return NextResponse.json(
      { success: false, error: "İşletme seçilemedi." },
      { status: 500 },
    );
  }
}
