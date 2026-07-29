import { apiError } from "@/lib/api/error-response";
import {
  TURNSTILE_ERROR_MESSAGE,
  verifyTurnstileToken,
} from "@/lib/security/turnstile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type ForgotPasswordBody = {
  email?: string;
  next?: string;
  turnstileToken?: string;
};

const RESET_REQUEST_MESSAGE =
  "Eğer bu e-posta sistemde kayıtlıysa birkaç dakika içinde şifre sıfırlama bağlantısı gelir. Gelmezse spam klasörünü kontrol edin veya işletmeden hesap daveti isteyin.";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeLoginReturnPath(value: unknown) {
  return value === "/customer/login" ? value : "/login";
}

function getSiteOrigin(request: NextRequest) {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  let body: ForgotPasswordBody;

  try {
    body = (await request.json()) as ForgotPasswordBody;
  } catch {
    return apiError("Geçersiz istek gövdesi.", 400, "BAD_REQUEST");
  }

  const turnstileOk = await verifyTurnstileToken({
    request,
    token: body.turnstileToken,
    expectedAction: "forgot_password",
  });

  if (!turnstileOk) {
    return apiError(TURNSTILE_ERROR_MESSAGE, 400, "VALIDATION_ERROR");
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !isValidEmail(email)) {
    return apiError("Geçerli bir e-posta adresi girin.", 400, "BAD_REQUEST");
  }

  const nextPath = normalizeLoginReturnPath(body.next);
  const redirectTo = `${getSiteOrigin(request)}/reset-password?next=${encodeURIComponent(nextPath)}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error("Password reset request failed:", error.code);
  }

  return NextResponse.json(
    {
      success: true,
      message: RESET_REQUEST_MESSAGE,
    },
    { status: 200 },
  );
}
