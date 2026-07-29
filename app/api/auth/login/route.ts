import { apiError } from "@/lib/api/error-response";
import {
  TURNSTILE_ERROR_MESSAGE,
  verifyTurnstileToken,
} from "@/lib/security/turnstile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type LoginBody = {
  email?: string;
  password?: string;
  turnstileToken?: string;
};

const INVALID_LOGIN_MESSAGE = "E-posta veya şifre hatalı.";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return apiError("Geçersiz istek gövdesi.", 400, "BAD_REQUEST");
  }

  const turnstileOk = await verifyTurnstileToken({
    request,
    token: body.turnstileToken,
    expectedAction: "admin_login",
  });

  if (!turnstileOk) {
    return apiError(TURNSTILE_ERROR_MESSAGE, 400, "VALIDATION_ERROR");
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !isValidEmail(email) || !password) {
    return apiError(INVALID_LOGIN_MESSAGE, 401, "UNAUTHORIZED");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return apiError(INVALID_LOGIN_MESSAGE, 401, "UNAUTHORIZED");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", data.user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    await supabase.auth.signOut();
    return apiError("Bu hesap işletme paneline erişemez.", 403, "FORBIDDEN");
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
