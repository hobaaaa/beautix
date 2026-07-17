import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type WorkingHoursDayPayload = {
  day_of_week: number;
  is_enabled: boolean;
  start_time: string | null;
  end_time: string | null;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function timeToMinutes(value: string) {
  const normalizedValue = normalizeTime(value);
  const [hours, minutes] = normalizedValue.split(":").map(Number);
  return hours * 60 + minutes;
}

function isValidTime(value: string) {
  return TIME_PATTERN.test(value);
}

export async function PATCH(request: NextRequest) {
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
        { success: false, error: "Kullanıcı herhangi bir işletmeye bağlı değil." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { days } = body as { days?: WorkingHoursDayPayload[] };

    if (!Array.isArray(days)) {
      return NextResponse.json(
        { success: false, error: "days alanı bir dizi olmalıdır." },
        { status: 400 },
      );
    }

    if (days.length !== 7) {
      return NextResponse.json(
        { success: false, error: "days alanı tam olarak 7 öğe içermelidir." },
        { status: 400 },
      );
    }

    const seenDays = new Set<number>();

    for (const day of days) {
      if (
        typeof day?.day_of_week !== "number" ||
        !Number.isInteger(day.day_of_week) ||
        day.day_of_week < 1 ||
        day.day_of_week > 7
      ) {
        return NextResponse.json(
          { success: false, error: "day_of_week değeri 1 ile 7 arasında bir tam sayı olmalıdır." },
          { status: 400 },
        );
      }

      if (seenDays.has(day.day_of_week)) {
        return NextResponse.json(
          { success: false, error: "day_of_week değerleri benzersiz olmalıdır." },
          { status: 400 },
        );
      }
      seenDays.add(day.day_of_week);

      if (typeof day.is_enabled !== "boolean") {
        return NextResponse.json(
          { success: false, error: "is_enabled alanı true veya false olmalıdır." },
          { status: 400 },
        );
      }

      if (!day.is_enabled) {
        continue;
      }

      if (typeof day.start_time !== "string" || typeof day.end_time !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "is_enabled true olduğunda başlangıç ve bitiş saati zorunludur.",
          },
          { status: 400 },
        );
      }

      if (!isValidTime(day.start_time) || !isValidTime(day.end_time)) {
        return NextResponse.json(
          {
            success: false,
            error: "Başlangıç ve bitiş saati HH:mm formatında olmalıdır.",
          },
          { status: 400 },
        );
      }

      if (timeToMinutes(day.start_time) >= timeToMinutes(day.end_time)) {
        return NextResponse.json(
          { success: false, error: "Başlangıç saati bitiş saatinden önce olmalıdır." },
          { status: 400 },
        );
      }
    }

    const enabledDays = days.filter((day) => day.is_enabled);
    const disabledDayNumbers = days
      .filter((day) => !day.is_enabled)
      .map((day) => day.day_of_week);

    if (enabledDays.length > 0) {
      const upsertPayload = enabledDays.map((day) => ({
        org_id: membership.org_id,
        day_of_week: day.day_of_week,
        start_time: normalizeTime(day.start_time!),
        end_time: normalizeTime(day.end_time!),
      }));

      const { error: upsertError } = await supabase
        .from("working_hours")
        .upsert(upsertPayload, {
          onConflict: "org_id,day_of_week",
        });

      if (upsertError) {
        console.error("Error upserting working hours:", upsertError);
        return NextResponse.json(
          { success: false, error: "Çalışma saatleri kaydedilemedi." },
          { status: 500 },
        );
      }
    }

    if (disabledDayNumbers.length > 0) {
      const { error: deleteError } = await supabase
        .from("working_hours")
        .delete()
        .eq("org_id", membership.org_id)
        .in("day_of_week", disabledDayNumbers);

      if (deleteError) {
        console.error("Error deleting disabled working hours:", deleteError);
        return NextResponse.json(
          { success: false, error: "Çalışma saatleri kaydedilemedi." },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating working hours:", error);
    return NextResponse.json(
      { success: false, error: "Çalışma saatleri güncellenemedi." },
      { status: 500 },
    );
  }
}

