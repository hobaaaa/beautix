import { getCurrentOrgContext } from "@/lib/supabase/org";
import { NextRequest, NextResponse } from "next/server";

type UpdateStaffBody = {
  name?: string;
  is_active?: boolean;
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

function areSameIds(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();

  return leftSorted.every((id, index) => id === rightSorted[index]);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id || !isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir personel kimliği zorunludur." },
        { status: 400 },
      );
    }

    const { supabase, orgId } = await getCurrentOrgContext();
    const body = (await request.json()) as UpdateStaffBody;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const appointmentTypeIds = normalizeAppointmentTypeIds(body.appointment_type_ids);

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Personel adı zorunludur." },
        { status: 400 },
      );
    }

    if (typeof body.is_active !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Aktiflik durumu zorunludur." },
        { status: 400 },
      );
    }

    if (!appointmentTypeIds || appointmentTypeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "En az bir hizmet seçmeniz gerekir." },
        { status: 400 },
      );
    }

    const { data: existingStaff, error: existingStaffError } = await supabase
      .from("staff")
      .select("id")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();

    if (existingStaffError || !existingStaff) {
      return NextResponse.json(
        { success: false, error: "Personel bulunamadı." },
        { status: 404 },
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

    const { data: existingMappings, error: mappingReadError } = await supabase
      .from("staff_appointment_types")
      .select("appointment_type_id")
      .eq("staff_id", id);

    if (mappingReadError) {
      return NextResponse.json(
        { success: false, error: "Personel hizmetleri güncellenemedi." },
        { status: 500 },
      );
    }

    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .update({
        name,
        is_active: body.is_active,
      })
      .eq("id", id)
      .eq("org_id", orgId)
      .select("id, org_id, name, is_active, created_at")
      .single();

    if (staffError || !staff) {
      return NextResponse.json(
        { success: false, error: "Personel güncellenemedi." },
        { status: 500 },
      );
    }

    const existingAppointmentTypeIds = (existingMappings ?? []).map(
      (mapping) => mapping.appointment_type_id,
    );

    if (!areSameIds(existingAppointmentTypeIds, appointmentTypeIds)) {
      const idsToDelete = existingAppointmentTypeIds.filter(
        (appointmentTypeId) => !appointmentTypeIds.includes(appointmentTypeId),
      );
      const idsToInsert = appointmentTypeIds.filter(
        (appointmentTypeId) => !existingAppointmentTypeIds.includes(appointmentTypeId),
      );

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("staff_appointment_types")
          .delete()
          .eq("staff_id", id)
          .in("appointment_type_id", idsToDelete);

        if (deleteError) {
          return NextResponse.json(
            { success: false, error: "Personel hizmetleri güncellenemedi." },
            { status: 500 },
          );
        }
      }

      if (idsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("staff_appointment_types")
          .insert(
            idsToInsert.map((appointmentTypeId) => ({
              staff_id: id,
              appointment_type_id: appointmentTypeId,
            })),
          );

        if (insertError) {
          return NextResponse.json(
            { success: false, error: "Personel hizmetleri güncellenemedi." },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({ success: true, data: staff }, { status: 200 });
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { success: false, error: "Personel güncellenemedi." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id || !isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir personel kimliği zorunludur." },
        { status: 400 },
      );
    }

    const { supabase, orgId } = await getCurrentOrgContext();

    const { data: existingStaff, error: existingStaffError } = await supabase
      .from("staff")
      .select("id, is_active")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();

    if (existingStaffError || !existingStaff) {
      return NextResponse.json(
        { success: false, error: "Personel bulunamadı." },
        { status: 404 },
      );
    }

    if (existingStaff.is_active) {
      return NextResponse.json(
        { success: false, error: "Aktif personel silinemez. Önce pasife alınmalıdır." },
        { status: 400 },
      );
    }

    const { data: existingAppointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id")
      .eq("org_id", orgId)
      .eq("staff_id", id)
      .limit(1)
      .maybeSingle();

    if (appointmentError) {
      return NextResponse.json(
        { success: false, error: "Personel silinmeden önce randevu kontrolü yapılamadı." },
        { status: 500 },
      );
    }

    if (existingAppointment) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bu personele ait randevu kayıtları olduğu için silinemez. Pasif olarak listeden kaldırılmalıdır.",
        },
        { status: 400 },
      );
    }

    const { error: deleteMappingsError } = await supabase
      .from("staff_appointment_types")
      .delete()
      .eq("staff_id", id);

    if (deleteMappingsError) {
      return NextResponse.json(
        { success: false, error: "Personel silinemedi." },
        { status: 500 },
      );
    }

    const { data: deletedStaff, error: deleteError } = await supabase
      .from("staff")
      .delete()
      .eq("id", id)
      .eq("org_id", orgId)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: "Personel silinemedi." },
        { status: 500 },
      );
    }

    if (!deletedStaff) {
      return NextResponse.json(
        {
          success: false,
          error: "Personel silinemedi. Veritabanı yetkileri kontrol edilmelidir.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { success: false, error: "Personel silinemedi." },
      { status: 500 },
    );
  }
}

