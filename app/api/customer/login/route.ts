import { apiError } from "@/lib/api/error-response";
import { getAuthMessages } from "@/lib/i18n/auth";
import { isLocale } from "@/lib/i18n/constants";
import {
  verifyTurnstileToken,
} from "@/lib/security/turnstile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type CustomerLoginBody = {
  email?: string;
  password?: string;
  locale?: string;
  turnstileToken?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  let body: CustomerLoginBody;

  try {
    body = (await request.json()) as CustomerLoginBody;
  } catch {
    return apiError("Geçersiz istek gövdesi.", 400, "BAD_REQUEST");
  }

  const locale = isLocale(body.locale) ? body.locale : undefined;
  const t = getAuthMessages(locale);
  const invalidLoginMessage =
    locale === "en" ? "Email or password is incorrect." : "E-posta veya şifre hatalı.";

  const turnstileOk = await verifyTurnstileToken({
    request,
    token: body.turnstileToken,
    expectedAction: "customer_login",
  });

  if (!turnstileOk) {
    return apiError(t.turnstileFailed, 400, "VALIDATION_ERROR");
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !isValidEmail(email) || !password) {
    return apiError(invalidLoginMessage, 401, "UNAUTHORIZED");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return apiError(invalidLoginMessage, 401, "UNAUTHORIZED");
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", data.user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (clientError || !client) {
    await supabase.auth.signOut();
    return apiError(
      locale === "en"
        ? "This account is not linked to any business."
        : "Bu hesap herhangi bir işletmeye bağlı değil.",
      403,
      "FORBIDDEN",
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
