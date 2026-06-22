import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type CreateAppointmentBody = {
  client_id?: string;
  appointment_type_id?: string;
  date?: string;
  start_time?: string;
  notes?: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const ISTANBUL_OFFSET = "+03:00";

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function buildStartAt(date: string, startTime: string) {
  return new Date(`${date}T${startTime}:00${ISTANBUL_OFFSET}`);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
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

    const body = (await request.json()) as CreateAppointmentBody;
    const { client_id, appointment_type_id, date, start_time, notes } = body;

    if (!client_id || !isValidUuid(client_id)) {
      return NextResponse.json(
        { success: false, error: "Valid client_id is required" },
        { status: 400 },
      );
    }

    if (!appointment_type_id || !isValidUuid(appointment_type_id)) {
      return NextResponse.json(
        { success: false, error: "Valid appointment_type_id is required" },
        { status: 400 },
      );
    }

    if (!date || !DATE_PATTERN.test(date)) {
      return NextResponse.json(
        { success: false, error: "Valid date is required" },
        { status: 400 },
      );
    }

    if (!start_time || !TIME_PATTERN.test(start_time)) {
      return NextResponse.json(
        { success: false, error: "Valid start_time is required" },
        { status: 400 },
      );
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", client_id)
      .eq("org_id", membership.org_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: "Selected client was not found" },
        { status: 400 },
      );
    }

    const { data: appointmentType, error: appointmentTypeError } =
      await supabase
        .from("appointment_types")
        .select("id, duration_minutes, is_active")
        .eq("id", appointment_type_id)
        .eq("org_id", membership.org_id)
        .single();

    if (appointmentTypeError || !appointmentType) {
      return NextResponse.json(
        { success: false, error: "Selected service was not found" },
        { status: 400 },
      );
    }

    if (!appointmentType.is_active) {
      return NextResponse.json(
        { success: false, error: "Selected service is not active" },
        { status: 400 },
      );
    }

    const startAt = buildStartAt(date, start_time);

    if (Number.isNaN(startAt.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date or start_time" },
        { status: 400 },
      );
    }

    const endAt = new Date(startAt.getTime() + appointmentType.duration_minutes * 60000);

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        org_id: membership.org_id,
        client_id,
        appointment_type_id,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        status: "confirmed",
        notes: notes?.trim() ? notes.trim() : null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to create appointment" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create appointment" },
      { status: 500 },
    );
  }
}
