import { getCurrentOrgContext } from "@/lib/supabase/org";
import { NextRequest, NextResponse } from "next/server";

type CreateStaffBody = {
  name?: string;
  appointment_type_ids?: string[];
};

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeAppointmentTypeIds(value: unknown) {
  if (!Array.isArray(value)) return null;

  const ids = value.filter((item): item is string => typeof item === "string");
  const uniqueIds = Array.from(new Set(ids));

  if (uniqueIds.length !== ids.length) {
    return null;
  }

  if (uniqueIds.some((id) => !isValidUuid(id))) {
    return null;
  }

  return uniqueIds;
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, orgId } = await getCurrentOrgContext();
    const body = (await request.json()) as CreateStaffBody;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const appointmentTypeIds = normalizeAppointmentTypeIds(body.appointment_type_ids);

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Personel adı zorunludur." },
        { status: 400 },
      );
    }

    if (!appointmentTypeIds || appointmentTypeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "En az bir hizmet seçmeniz gerekir." },
        { status: 400 },
      );
    }

    const { data: services, error: serviceError } = await supabase
      .from("appointment_types")
      .select("id")
      .eq("org_id", orgId)
      .in("id", appointmentTypeIds);

    if (serviceError || (services ?? []).length !== appointmentTypeIds.length) {
      return NextResponse.json(
        { success: false, error: "Seçilen hizmetlerden biri geçersiz." },
        { status: 400 },
      );
    }

    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .insert({
        org_id: orgId,
        name,
        is_active: true,
      })
      .select("id, org_id, name, is_active, created_at")
      .single();

    if (staffError || !staff) {
      return NextResponse.json(
        { success: false, error: "Personel oluşturulamadı." },
        { status: 500 },
      );
    }

    const { error: mappingError } = await supabase
      .from("staff_appointment_types")
      .insert(
        appointmentTypeIds.map((appointmentTypeId) => ({
          staff_id: staff.id,
          appointment_type_id: appointmentTypeId,
        })),
      );

    if (mappingError) {
      return NextResponse.json(
        { success: false, error: "Personel hizmetleri kaydedilemedi." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: staff }, { status: 201 });
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { success: false, error: "Personel oluşturulamadı." },
      { status: 500 },
    );
  }
}

