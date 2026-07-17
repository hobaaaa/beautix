export const PUBLIC_SLUG_MIN_LENGTH = 3;
export const PUBLIC_SLUG_MAX_LENGTH = 60;

const TURKISH_CHARACTER_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

export const RESERVED_PUBLIC_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "book",
  "booking",
  "customer",
  "dashboard",
  "login",
  "logout",
  "notifications",
  "settings",
]);

export function normalizePublicSlug(value: string) {
  return value
    .trim()
    .replace(/[çÇğĞıIİöÖşŞüÜ]/g, (character) => TURKISH_CHARACTER_MAP[character] ?? "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, PUBLIC_SLUG_MAX_LENGTH)
    .replace(/^-|-$/g, "");
}

export function isValidPublicSlug(value: string) {
  return (
    value.length >= PUBLIC_SLUG_MIN_LENGTH &&
    value.length <= PUBLIC_SLUG_MAX_LENGTH &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) &&
    !RESERVED_PUBLIC_SLUGS.has(value)
  );
}

export function getPublicSlugValidationMessage(value: string) {
  if (RESERVED_PUBLIC_SLUGS.has(value)) {
    return "Bu bağlantı adı sistem tarafından ayrılmıştır.";
  }

  return "Bağlantı adı yalnızca küçük harf, rakam ve tire içerebilir.";
}
