import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function normalizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return "/admin";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback exchange failed:", error.message);
      const errorUrl = new URL(next, requestUrl.origin);
      errorUrl.searchParams.set("error", "auth_callback_failed");
      return NextResponse.redirect(errorUrl);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
