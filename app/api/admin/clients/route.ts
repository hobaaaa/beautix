import { getCurrentOrgContext } from "@/lib/supabase/org";
import { NextRequest, NextResponse } from "next/server";

type CreateClientBody = {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  email?: string;
  address?: string | null;
  notes?: string | null;
  birth_date?: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isDuplicateEmailError(error: { code?: string; message?: string }) {
  return (
    error.code === "23505" ||
    error.message?.includes("clients_org_email_unique_idx") === true
  );
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, orgId } = await getCurrentOrgContext();
    const body = (await request.json()) as CreateClientBody;
    const firstName = typeof body.first_name === "string" ? body.first_name.trim() : "";
    const lastName = typeof body.last_name === "string" ? body.last_name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const birthDate = optionalText(body.birth_date);

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, error: "Ad, soyad ve e-posta alanları zorunludur." },
        { status: 400 },
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir e-posta adresi girin." },
        { status: 400 },
      );
    }

    if (birthDate && !DATE_PATTERN.test(birthDate)) {
      return NextResponse.json(
        { success: false, error: "Doğum tarihi geçersiz." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("clients")
      .insert({
        org_id: orgId,
        user_id: null,
        name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        phone: optionalText(body.phone),
        email,
        address: optionalText(body.address),
        notes: optionalText(body.notes),
        birth_date: birthDate,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) {
      if (isDuplicateEmailError(error)) {
        return NextResponse.json(
          { success: false, error: "Bu e-posta adresiyle kayıtlı bir müşteri zaten var." },
          { status: 409 },
        );
      }

      console.error("Client create failed:", error.code);
      return NextResponse.json(
        { success: false, error: "Müşteri oluşturulamadı." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Client create failed:", error);
    return NextResponse.json(
      { success: false, error: "Müşteri oluşturulamadı." },
      { status: 500 },
    );
  }
}
