import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse, NextRequest } from "next/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
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
        { error: "Kullanıcı herhangi bir işletmeye bağlı değil." },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("appointment_types")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: "Hizmetler alınamadı." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { success: false, error: "Hizmetler alınamadı." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();
    const { name, duration_minutes } = body;
    const duration = Number(duration_minutes);
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Hizmet adı zorunludur." },
        { status: 400 },
      );
    }
    if (!Number.isInteger(duration) || duration <= 0 || duration > 600) {
      return NextResponse.json(
        { success: false, error: "Süre 1 ile 600 dakika arasında olmalıdır." },
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
      .insert({
        name: name.trim(),
        duration_minutes: duration,
        org_id: membership.org_id,
        is_active: true,
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { success: false, error: "Hizmet oluşturulamadı." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error create services:", error);
    return NextResponse.json(
      { success: false, error: "Hizmet oluşturulamadı." },
      { status: 500 },
    );
  }
}
