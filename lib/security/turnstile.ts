import "server-only";

import { NextRequest } from "next/server";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_TOKEN_MAX_LENGTH = 2048;

export const TURNSTILE_ERROR_MESSAGE =
  "Güvenlik doğrulaması başarısız oldu. Lütfen tekrar deneyin.";

type TurnstileVerifyResponse = {
  success?: boolean;
  action?: string;
  "error-codes"?: string[];
};

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined
  );
}

export async function verifyTurnstileToken({
  request,
  token,
  expectedAction,
}: {
  request: NextRequest;
  token: unknown;
  expectedAction: string;
}) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey && process.env.NODE_ENV !== "production") {
    return true;
  }

  if (!secretKey) {
    console.error("Turnstile secret key is missing.");
    return false;
  }

  if (
    typeof token !== "string" ||
    token.trim() === "" ||
    token.length > TURNSTILE_TOKEN_MAX_LENGTH
  ) {
    return false;
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: getClientIp(request),
      }),
    });
    const payload = (await response.json()) as TurnstileVerifyResponse;

    if (!payload.success) {
      console.warn("Turnstile verification failed:", payload["error-codes"]);
      return false;
    }

    if (payload.action && payload.action !== expectedAction) {
      console.warn("Turnstile action mismatch.");
      return false;
    }

    return true;
  } catch {
    console.error("Turnstile verification request failed.");
    return false;
  }
}
