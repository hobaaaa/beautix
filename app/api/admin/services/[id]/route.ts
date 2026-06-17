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
        { success: false, error: "Service id is required" },
        { status: 400 },
      );
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
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
        { success: false, error: "User is not a member of any organization" },
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
        { success: false, error: "Failed to delete service" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Service deleted", data },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete service" },
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
        { success: false, error: "Service id is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { success: false, error: "is_active must be a boolean" },
        { status: 400 },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
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
        { success: false, error: "User is not a member of any organization" },
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
        { success: false, error: "Failed to update service" },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update service" },
      { status: 500 },
    );
  }
}
