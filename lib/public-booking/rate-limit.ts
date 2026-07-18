import "server-only";

import { createHmac } from "crypto";
import { normalizePublicBookingPhone } from "./normalize-contact";
import type { NextRequest } from "next/server";

const HMAC_ALGORITHM = "sha256";

export const PUBLIC_BOOKING_RATE_LIMIT_MESSAGE =
  "Çok fazla randevu denemesi yaptınız. Lütfen bir süre sonra tekrar deneyin.";

export function getPublicBookingRateLimitSecret() {
  return process.env.BOOKING_RATE_LIMIT_SECRET ?? "";
}

export function hashPublicBookingValue(value: string, secret: string) {
  return createHmac(HMAC_ALGORITHM, secret).update(value).digest("hex");
}

export function getPublicBookingClientIdentifier(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor
    ?.split(",")
    .map((value) => value.trim())
    .find(Boolean);

  if (forwardedIp) {
    return `ip:${forwardedIp}`;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();

  if (realIp) {
    return `ip:${realIp}`;
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 160) ?? "unknown";
  const acceptLanguage =
    request.headers.get("accept-language")?.slice(0, 80) ?? "unknown";

  return `fallback:${userAgent}:${acceptLanguage}`;
}

export function createPublicBookingIpHash(request: NextRequest, secret: string) {
  return hashPublicBookingValue(getPublicBookingClientIdentifier(request), secret);
}

export function createPublicBookingContactHashes({
  email,
  phone,
  secret,
}: {
  email: string;
  phone: string;
  secret: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = normalizePublicBookingPhone(phone);
  const hashes = new Set<string>();

  if (normalizedEmail) {
    hashes.add(hashPublicBookingValue(`email:${normalizedEmail}`, secret));
  }

  if (normalizedPhone) {
    hashes.add(hashPublicBookingValue(`phone:${normalizedPhone}`, secret));
  }

  return Array.from(hashes);
}

export function isValidPublicBookingStartedAt(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  const startedAt = new Date(value);
  const startedAtTime = startedAt.getTime();

  if (Number.isNaN(startedAtTime)) {
    return false;
  }

  const now = Date.now();
  const elapsedMs = now - startedAtTime;
  const maxAgeMs = 24 * 60 * 60 * 1000;

  return elapsedMs >= 2000 && elapsedMs <= maxAgeMs;
}
