import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  locales,
  type Locale,
} from "./constants";

export { defaultLocale, isLocale, localeCookieName, locales, type Locale };

export async function getPreferredLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;

  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const headerStore = await headers();
  const acceptedLanguage = headerStore.get("accept-language") ?? "";
  const preferredLanguage = acceptedLanguage
    .split(",")
    .map((item) => item.trim().split(";")[0]?.toLowerCase())
    .find(Boolean);

  if (preferredLanguage?.startsWith("en")) {
    return "en";
  }

  return defaultLocale;
}
