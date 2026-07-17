import { createSupabaseServerClient } from "@/lib/supabase/server";
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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error logging out:", error);
    return NextResponse.json(
      { success: false, error: "Çıkış yapılırken bir hata oluştu." },
      { status: 500 },
    );
  }
}

