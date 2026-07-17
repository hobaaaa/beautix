import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse, NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Hizmet kimliği zorunludur." },
        { status: 400 },
      );
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı doğrulanamadı." },
        { status: 401 },
      );
    }

    const { data: membership, error: memberError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı herhangi bir işletmeye bağlı değil." },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("appointment_types")
      .delete() //delete operation
      .eq("id", id)
      .eq("org_id", membership.org_id)
      .select("id")
      .single(); // multi tenant check

    if (error) {
      return NextResponse.json(
        { success: false, error: "Hizmet silinemedi." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Hizmet silindi.", data },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { success: false, error: "Hizmet silinemedi." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Hizmet kimliği zorunludur." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { success: false, error: "is_active alanı true veya false olmalıdır." },
        { status: 400 },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı doğrulanamadı." },
        { status: 401 },
      );
    }

    const { data: membership, error: memberError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı herhangi bir işletmeye bağlı değil." },
        { status: 403 },
      );
    }
    const { data, error } = await supabase
      .from("appointment_types")
      .update({ is_active })
      .eq("id", id)
      .eq("org_id", membership.org_id) // multi tenant check
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: "Hizmet güncellenemedi." },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { success: false, error: "Hizmet güncellenemedi." },
      { status: 500 },
    );
  }
}

