import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DEMO_MARKER = "ARTEXO_DEMO_ACCOUNT_V1";
const isDryRun = process.argv.includes("--dry-run");

function loadLocalEnv() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  }
}

loadLocalEnv();

const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
  orgId: process.env.DEMO_ORG_ID || randomUUID(),
  orgName: process.env.DEMO_ORG_NAME || "Artexo Demo",
  publicSlug: process.env.DEMO_PUBLIC_SLUG || "artexo-demo",
  locale: process.env.DEMO_LOCALE === "en" ? "en" : "tr",
  adminEmail: process.env.DEMO_ADMIN_EMAIL,
  adminPassword: process.env.DEMO_ADMIN_PASSWORD,
  customerEmail: process.env.DEMO_CUSTOMER_EMAIL,
  customerPassword: process.env.DEMO_CUSTOMER_PASSWORD,
};

function fail(message) {
  console.error(`[demo-accounts] ${message}`);
  process.exit(1);
}

function safeError(error) {
  if (!error) return "unknown_error";
  return [error.code, error.message].filter(Boolean).join(": ").slice(0, 240);
}

function logStage(stage, details) {
  console.log(`[demo-accounts] ${stage}: ${details}`);
}

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function assertConfig() {
  if (process.env.ALLOW_DEMO_ACCOUNT_PROVISION !== "true") {
    fail("ALLOW_DEMO_ACCOUNT_PROVISION=true olmadan demo account provision calismaz.");
  }

  const required = {
    NEXT_PUBLIC_SUPABASE_URL: config.supabaseUrl,
    SUPABASE_SECRET_KEY: config.supabaseSecretKey,
    DEMO_ADMIN_EMAIL: config.adminEmail,
    DEMO_ADMIN_PASSWORD: config.adminPassword,
    DEMO_CUSTOMER_EMAIL: config.customerEmail,
    DEMO_CUSTOMER_PASSWORD: config.customerPassword,
  };

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      fail(`${key} env degeri zorunludur.`);
    }
  }

  if (!isValidUuid(config.orgId)) {
    fail("DEMO_ORG_ID gecerli bir UUID olmalidir.");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.publicSlug)) {
    fail("DEMO_PUBLIC_SLUG sadece kucuk harf, rakam ve tire icermelidir.");
  }

  if (!["tr", "en"].includes(config.locale)) {
    fail("DEMO_LOCALE tr veya en olmalidir.");
  }
}

function createSupabase() {
  return createClient(config.supabaseUrl, config.supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function findUserByEmail(supabase, email) {
  const normalizedEmail = email.trim().toLowerCase();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      fail(`auth user lookup failed: ${safeError(error)}`);
    }

    const user = data.users.find(
      (item) => item.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (user) return user;
    if (data.users.length < 100) return null;

    page += 1;
  }

  fail("auth user lookup page limit exceeded.");
}

async function ensureAuthUser(supabase, { email, password, label }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(supabase, normalizedEmail);

  if (existing) {
    if (!isDryRun) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: {
          ...existing.user_metadata,
          demo_marker: DEMO_MARKER,
        },
      });

      if (error) {
        fail(`${label} auth user update failed: ${safeError(error)}`);
      }
    }

    logStage(label, `existing user ${existing.id}`);
    return existing.id;
  }

  if (isDryRun) {
    const dryId = `dry-${label}-user`;
    logStage(label, `would create ${normalizedEmail}`);
    return dryId;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: {
      demo_marker: DEMO_MARKER,
    },
  });

  if (error || !data.user) {
    fail(`${label} auth user create failed: ${safeError(error)}`);
  }

  logStage(label, `created user ${data.user.id}`);
  return data.user.id;
}

async function ensureOrgMembership(supabase, userId) {
  if (isDryRun) {
    logStage("org_members", `would ensure ${userId} -> ${config.orgId}`);
    return;
  }

  const { data: existing, error: lookupError } = await supabase
    .from("org_members")
    .select("org_id, user_id")
    .eq("org_id", config.orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupError) {
    fail(`org_members lookup failed: ${safeError(lookupError)}`);
  }

  if (existing) {
    logStage("org_members", "existing admin membership");
    return;
  }

  const { error } = await supabase.from("org_members").insert({
    org_id: config.orgId,
    user_id: userId,
  });

  if (error) {
    fail(`org_members insert failed: ${safeError(error)}`);
  }

  logStage("org_members", "admin membership inserted");
}

async function ensureOrganization(supabase) {
  if (isDryRun) {
    logStage("organizations", `would ensure ${config.orgId}`);
    return;
  }

  const { data: existing, error: lookupError } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", config.orgId)
    .maybeSingle();

  if (lookupError && lookupError.code !== "42P01") {
    fail(`organization lookup failed: ${safeError(lookupError)}`);
  }

  if (lookupError?.code === "42P01") {
    logStage("organizations", "table not found, skipped");
    return;
  }

  if (existing) {
    logStage("organizations", "existing organization");
    return;
  }

  const { error } = await supabase.from("organizations").insert({
    id: config.orgId,
    name: config.orgName,
  });

  if (error) {
    fail(`organization insert failed: ${safeError(error)}`);
  }

  logStage("organizations", "organization inserted");
}

async function ensureOrganizationProfile(supabase) {
  if (isDryRun) {
    logStage("organization_profiles", `would upsert ${config.orgName}`);
    return;
  }

  const { error } = await supabase.from("organization_profiles").upsert(
    {
      org_id: config.orgId,
      name: config.orgName,
      public_slug: config.publicSlug,
      default_locale: config.locale,
    },
    {
      onConflict: "org_id",
    },
  );

  if (error) {
    fail(`organization profile upsert failed: ${safeError(error)}`);
  }

  logStage("organization_profiles", "profile upserted");
}

async function ensureDemoCustomerClient(supabase, customerUserId) {
  const normalizedEmail = config.customerEmail.trim().toLowerCase();

  if (isDryRun) {
    logStage("clients", `would ensure demo customer ${normalizedEmail}`);
    return;
  }

  const { data: existing, error: lookupError } = await supabase
    .from("clients")
    .select("id")
    .eq("org_id", config.orgId)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (lookupError) {
    fail(`client lookup failed: ${safeError(lookupError)}`);
  }

  const payload = {
    org_id: config.orgId,
    user_id: customerUserId,
    name: config.locale === "en" ? "[DEMO] Demo Customer" : "[DEMO] Demo Musteri",
    first_name: "[DEMO] Demo",
    last_name: config.locale === "en" ? "Customer" : "Musteri",
    phone: "+90 555 000 00 00",
    email: normalizedEmail,
    address: config.locale === "en" ? "Demo address" : "Demo adres",
    notes: `${DEMO_MARKER} - Demo customer account`,
    birth_date: null,
    is_active: true,
  };

  if (existing) {
    const { error } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", existing.id)
      .eq("org_id", config.orgId);

    if (error) {
      fail(`client update failed: ${safeError(error)}`);
    }

    logStage("clients", `demo customer updated ${existing.id}`);
    return;
  }

  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    fail(`client insert failed: ${safeError(error)}`);
  }

  logStage("clients", `demo customer inserted ${data.id}`);
}

async function main() {
  assertConfig();
  const supabase = createSupabase();

  console.log(`[demo-accounts] mode=${isDryRun ? "dry-run" : "write"}`);
  console.log(`[demo-accounts] org_id=${config.orgId}`);
  console.log(`[demo-accounts] public_slug=${config.publicSlug}`);
  console.log(`[demo-accounts] locale=${config.locale}`);

  const adminUserId = await ensureAuthUser(supabase, {
    email: config.adminEmail,
    password: config.adminPassword,
    label: "admin",
  });
  const customerUserId = await ensureAuthUser(supabase, {
    email: config.customerEmail,
    password: config.customerPassword,
    label: "customer",
  });

  await ensureOrganization(supabase);
  await ensureOrgMembership(supabase, adminUserId);
  await ensureOrganizationProfile(supabase);
  await ensureDemoCustomerClient(supabase, customerUserId);

  console.log("[demo-accounts] complete", {
    orgId: config.orgId,
    publicSlug: config.publicSlug,
    adminEmail: config.adminEmail,
    customerEmail: config.customerEmail,
  });
}

main().catch((error) => {
  fail(`unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
});
