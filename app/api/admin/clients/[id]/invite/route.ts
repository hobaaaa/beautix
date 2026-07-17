import { getCurrentOrgContext } from "@/lib/supabase/org";
import {
  SupabaseAdminConfigError,
  createSupabaseAdminClient,
} from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ClientInviteRow = {
  id: string;
  org_id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  is_active: boolean;
  user_id: string | null;
};

type AuthUserSummary = {
  id: string;
  email?: string;
};

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

function getClientName(client: ClientInviteRow) {
  return (
    client.name ||
    `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() ||
    "Müşteri"
  );
}

function isExistingUserInviteError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "email_exists" ||
    error.code === "user_already_exists" ||
    message.includes("already") ||
    message.includes("registered")
  );
}

function isEmailRateLimitError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "over_email_send_rate_limit" ||
    (message.includes("email") && message.includes("rate limit"))
  );
}

function emailRateLimitResponse() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Çok kısa sürede fazla e-posta denemesi yapıldı. Lütfen bir saat sonra tekrar deneyin.",
    },
    { status: 429 },
  );
}

async function findAuthUserByEmail(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      console.error("Client invite list users failed:", error.status, error.code);
      return null;
    }

    const user = data.users.find(
      (item: AuthUserSummary) => item.email?.toLowerCase() === email,
    );

    if (user) {
      return user;
    }

    if (!data.nextPage) {
      return null;
    }
  }

  return null;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase, orgId } = await getCurrentOrgContext();

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, org_id, name, first_name, last_name, email, is_active, user_id")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle<ClientInviteRow>();

    if (clientError) {
      console.error("Client invite lookup failed:", clientError.code);
      return NextResponse.json(
        { success: false, error: "Müşteri bilgisi doğrulanamadı." },
        { status: 500 },
      );
    }

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Müşteri bulunamadı." },
        { status: 404 },
      );
    }

    if (!client.is_active) {
      return NextResponse.json(
        { success: false, error: "Pasif müşteriye hesap daveti gönderilemez." },
        { status: 400 },
      );
    }

    const email = client.email?.trim().toLowerCase();

    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { success: false, error: "Bu müşteri için geçerli bir e-posta adresi gerekli." },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const redirectTo = `${getBaseUrl()}/reset-password?next=${encodeURIComponent(
      "/customer/login",
    )}`;

    if (client.user_id) {
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
        email,
        { redirectTo },
      );

      if (resetError) {
        if (isEmailRateLimitError(resetError)) {
          return emailRateLimitResponse();
        }

        console.error("Client invite reset failed:", resetError.status, resetError.code);
        return NextResponse.json(
          { success: false, error: "Davet gönderilirken bir hata oluştu." },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true });
    }

    const { data: invitedUser, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          client_id: client.id,
          org_id: client.org_id,
          role: "customer",
          name: getClientName(client),
        },
      });

    if (inviteError) {
      if (isEmailRateLimitError(inviteError)) {
        return emailRateLimitResponse();
      }

      if (isExistingUserInviteError(inviteError)) {
        const existingUser = await findAuthUserByEmail(supabaseAdmin, email);

        if (existingUser?.id) {
          const { error: linkError } = await supabase
            .from("clients")
            .update({ user_id: existingUser.id })
            .eq("id", client.id)
            .eq("org_id", orgId)
            .is("user_id", null);

          if (linkError) {
            console.error("Client existing auth user link failed:", linkError.code);
          }
        }

        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
          email,
          { redirectTo },
        );

        if (!resetError) {
          return NextResponse.json({ success: true });
        }

        if (isEmailRateLimitError(resetError)) {
          return emailRateLimitResponse();
        }

        console.error(
          "Client invite existing user reset failed:",
          resetError.status,
          resetError.code,
        );
      }

      console.error("Client invite failed:", inviteError.status, inviteError.code);
      return NextResponse.json(
        { success: false, error: "Davet gönderilirken bir hata oluştu." },
        { status: 500 },
      );
    }

    if (!invitedUser.user?.id) {
      return NextResponse.json({ success: true });
    }

    const { error: updateError } = await supabase
      .from("clients")
      .update({ user_id: invitedUser.user.id })
      .eq("id", client.id)
      .eq("org_id", orgId)
      .is("user_id", null);

    if (updateError) {
      console.error("Client invite user link failed:", updateError.code);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SupabaseAdminConfigError) {
      console.error("Client invite failed: missing SUPABASE_SECRET_KEY");
      return NextResponse.json(
        {
          success: false,
          error: "Davet göndermek için sunucu yapılandırması eksik.",
        },
        { status: 500 },
      );
    }

    console.error("Client invite failed:", error);
    return NextResponse.json(
      { success: false, error: "Davet gönderilirken bir hata oluştu." },
      { status: 500 },
    );
  }
}

