import {
  getPublicSlugValidationMessage,
  isValidPublicSlug,
  normalizePublicSlug,
} from "@/lib/organizations/slug";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { NextRequest, NextResponse } from "next/server";

type UpdatePublicSlugBody = {
  public_slug?: string;
};

function isDuplicateSlugError(error: { code?: string; message?: string }) {
  return (
    error.code === "23505" ||
    error.message?.includes("organization_profiles_public_slug_unique_idx") === true
  );
}

function isInvalidSlugError(error: { code?: string; message?: string }) {
  return (
    error.code === "23514" ||
    error.message?.includes("organization_profiles_public_slug_check") === true
  );
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, orgId } = await getCurrentOrgContext();
    const body = (await request.json()) as UpdatePublicSlugBody;
    const rawSlug = typeof body.public_slug === "string" ? body.public_slug : "";
    const publicSlug = normalizePublicSlug(rawSlug);

    if (!isValidPublicSlug(publicSlug)) {
      return NextResponse.json(
        { success: false, error: getPublicSlugValidationMessage(publicSlug) },
        { status: 400 },
      );
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("organization_profiles")
      .update({
        public_slug: publicSlug,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", orgId)
      .select("org_id, name, public_slug")
      .maybeSingle();

    if (updateError) {
      if (isDuplicateSlugError(updateError)) {
        return NextResponse.json(
          {
            success: false,
            error: "Bu bağlantı adı başka bir işletme tarafından kullanılıyor.",
          },
          { status: 409 },
        );
      }

      if (isInvalidSlugError(updateError)) {
        return NextResponse.json(
          {
            success: false,
            error: "Bağlantı adı yalnızca küçük harf, rakam ve tire içerebilir.",
          },
          { status: 400 },
        );
      }

      console.error("Organization public slug update failed:", updateError.code);
      return NextResponse.json(
        { success: false, error: "Public randevu bağlantısı güncellenemedi." },
        { status: 500 },
      );
    }

    if (updatedProfile) {
      return NextResponse.json({ success: true, data: updatedProfile });
    }

    const fallbackName = `İşletme ${orgId.slice(0, 8)}`;
    const { data, error } = await supabase
      .from("organization_profiles")
      .insert({
        org_id: orgId,
        name: fallbackName,
        public_slug: publicSlug,
      })
      .select("org_id, name, public_slug")
      .single();

    if (error) {
      if (isDuplicateSlugError(error)) {
        return NextResponse.json(
          {
            success: false,
            error: "Bu bağlantı adı başka bir işletme tarafından kullanılıyor.",
          },
          { status: 409 },
        );
      }

      if (isInvalidSlugError(error)) {
        return NextResponse.json(
          {
            success: false,
            error: "Bağlantı adı yalnızca küçük harf, rakam ve tire içerebilir.",
          },
          { status: 400 },
        );
      }

      console.error("Organization public slug insert failed:", error.code);
      return NextResponse.json(
        { success: false, error: "Public randevu bağlantısı güncellenemedi." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Organization public slug update failed:", error);
    return NextResponse.json(
      { success: false, error: "Public randevu bağlantısı güncellenemedi." },
      { status: 500 },
    );
  }
}
