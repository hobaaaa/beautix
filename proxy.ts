import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isLocale, localeCookieName } from "@/lib/i18n/constants";

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const firstSegment = request.nextUrl.pathname.split("/").filter(Boolean)[0];
  const locale = isLocale(firstSegment) ? firstSegment : undefined;

  if (locale) {
    requestHeaders.set("x-artexo-locale", locale);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (locale) {
    response.cookies.set(localeCookieName, locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // BU SATIR ÇOK ÖNEMLİ
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/customer/:path*",
    "/tr/:path*",
    "/en/:path*",
  ],
};
