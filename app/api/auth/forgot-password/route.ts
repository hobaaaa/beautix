import { apiError } from "@/lib/api/error-response";
import { getAuthMessages } from "@/lib/i18n/auth";
import { isLocale } from "@/lib/i18n/constants";
import {
  verifyTurnstileToken,
} from "@/lib/security/turnstile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type ForgotPasswordBody = {
  email?: string;
  next?: string;
  locale?: string;
  turnstileToken?: string;
};

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

  const locale = isLocale(body.locale) ? body.locale : undefined;
  const t = getAuthMessages(locale);

  const turnstileOk = await verifyTurnstileToken({
    request,
    token: body.turnstileToken,
    expectedAction: "forgot_password",
  });

  if (!turnstileOk) {
    return apiError(t.turnstileFailed, 400, "VALIDATION_ERROR");
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !isValidEmail(email)) {
    return apiError(t.emailInvalid, 400, "BAD_REQUEST");
  }

  const nextPath = normalizeLoginReturnPath(body.next);
  const localePrefix = locale ? `/${locale}` : "";
  const redirectTo = `${getSiteOrigin(request)}${localePrefix}/reset-password?next=${encodeURIComponent(nextPath)}`;
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
      message: t.resetRequestSuccess,
    },
    { status: 200 },
  );
}
