import {
  SupabaseAdminConfigError,
  createSupabaseAdminClient,
} from "@/lib/supabase/admin";
import { maskEmail } from "@/lib/notifications/email-masking";
import {
  renderAppointmentReminderEmail,
  renderBookingConfirmationEmail,
  renderBusinessBookingNotificationEmail,
  getAppointmentReminderEmailSubject,
  getBookingConfirmationEmailSubject,
  getBusinessBookingNotificationEmailSubject,
} from "@/lib/notifications/localized-appointment-email";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/constants";
import { NextRequest, NextResponse } from "next/server";

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

type ClaimedNotificationJob = {
  id: string;
  org_id: string;
  appointment_id: string;
  client_id: string;
  type: string;
  attempt_count: number;
  locale?: string | null;
};

type AppointmentRow = {
  id: string;
  org_id: string;
  client_id: string;
  appointment_type_id: string;
  staff_id: string;
  start_at: string;
  end_at: string;
  status: string;
  notes: string | null;
};

type ClientRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
};

type ServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
};

type StaffRow = {
  id: string;
  name: string;
};

type NotificationData = {
  appointment: AppointmentRow;
  client: ClientRow;
  service: ServiceRow;
  staff: StaffRow;
  organizationName: string;
  locale: Locale;
};

type ProcessResult =
  | {
      status: "sent";
      recipient: string | null;
      providerMessageId: string | null;
    }
  | {
      status: "skipped";
      recipient: string | null;
      errorMessage: string;
    };

const MAX_NOTIFICATION_ATTEMPTS = 2;
const RETRY_DELAY_MINUTES = 5;

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function organizationLabel(orgId: string) {
  return `İşletme ${orgId.slice(0, 8)}`;
}

function clientDisplayName(client: ClientRow) {
  const fullName = [client.first_name, client.last_name]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");

  return fullName || client.name || "Müşteri";
}

function safeErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error ?? "Bilinmeyen hata");

  return message.slice(0, 500);
}

function normalizeNotificationLocale(value: string | null | undefined): Locale {
  const candidate = value ?? undefined;

  return isLocale(candidate) ? candidate : defaultLocale;
}

function isNonRetryableError(value: string) {
  return value.startsWith("non_retryable:");
}

function hasReachedMaxAttempts(job: ClaimedNotificationJob) {
  return job.attempt_count + 1 >= MAX_NOTIFICATION_ATTEMPTS;
}

function shouldRetryNotificationError(
  job: ClaimedNotificationJob,
  errorMessage: string,
) {
  return !isNonRetryableError(errorMessage) && !hasReachedMaxAttempts(job);
}

async function insertNotificationLog({
  supabase,
  job,
  status,
  recipient,
  providerMessageId = null,
  errorMessage = null,
}: {
  supabase: SupabaseAdminClient;
  job: ClaimedNotificationJob;
  status: "sent" | "failed" | "skipped";
  recipient: string | null;
  providerMessageId?: string | null;
  errorMessage?: string | null;
}) {
  const { error } = await supabase.from("notification_logs").insert({
    org_id: job.org_id,
    notification_job_id: job.id,
    appointment_id: job.appointment_id,
    client_id: job.client_id,
    type: job.type,
    channel: "email",
    provider: "resend",
    status,
    attempt_number: job.attempt_count + 1,
    recipient,
    provider_message_id: providerMessageId,
    error_message: errorMessage,
  });

  if (error) {
    console.error("Notification log insert failed:", {
      jobId: job.id,
      status,
      error,
    });
  }
}

async function markJobFailed(
  supabase: SupabaseAdminClient,
  job: ClaimedNotificationJob,
  error: unknown,
) {
  await supabase
    .from("notification_jobs")
    .update({
      status: "failed",
      attempt_count: job.attempt_count + 1,
      last_error: safeErrorMessage(error),
      processed_at: new Date().toISOString(),
    })
    .eq("id", job.id);
}

async function scheduleJobRetry(
  supabase: SupabaseAdminClient,
  job: ClaimedNotificationJob,
  errorMessage: string,
) {
  const scheduledFor = new Date(
    Date.now() + RETRY_DELAY_MINUTES * 60 * 1000,
  ).toISOString();

  const { error } = await supabase
    .from("notification_jobs")
    .update({
      status: "pending",
      attempt_count: job.attempt_count + 1,
      scheduled_for: scheduledFor,
      processed_at: null,
      last_error: errorMessage,
    })
    .eq("id", job.id);

  if (error) {
    console.error("Notification retry scheduling failed:", {
      jobId: job.id,
      error,
    });

    await markJobFailed(supabase, job, errorMessage);
    throw error;
  }
}

async function markJobSent(supabase: SupabaseAdminClient, jobId: string) {
  await supabase
    .from("notification_jobs")
    .update({
      status: "sent",
      last_error: null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

async function sendEmailWithResend({
  to,
  subject,
  html,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: "Artexo <artexo@denizgokbudak.com>",
      to,
      subject,
      html,
    }),
  });

  let json: { id?: string; message?: string; error?: string } | null = null;

  try {
    json = (await response.json()) as {
      id?: string;
      message?: string;
      error?: string;
    };
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message =
      json?.message ??
      json?.error ??
      `Resend request failed with status ${response.status}.`;

    if (response.status === 429 || response.status >= 500) {
      throw new Error(message);
    }

    if (response.status >= 400 && response.status < 500) {
      throw new Error(`non_retryable:resend_client_error:${message}`);
    }

    throw new Error(message);
  }

  return json?.id ?? null;
}

async function getNotificationData(
  supabase: SupabaseAdminClient,
  job: ClaimedNotificationJob,
): Promise<NotificationData> {
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select(
      "id, org_id, client_id, appointment_type_id, staff_id, start_at, end_at, status, notes",
    )
    .eq("id", job.appointment_id)
    .eq("org_id", job.org_id)
    .eq("client_id", job.client_id)
    .maybeSingle<AppointmentRow>();

  if (appointmentError || !appointment) {
    throw new Error("non_retryable:appointment_not_found");
  }

  const [
    { data: client, error: clientError },
    { data: service, error: serviceError },
    { data: staff, error: staffError },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id, first_name, last_name, name, phone, email")
      .eq("id", appointment.client_id)
      .eq("org_id", appointment.org_id)
      .maybeSingle<ClientRow>(),
    supabase
      .from("appointment_types")
      .select("id, name, duration_minutes")
      .eq("id", appointment.appointment_type_id)
      .eq("org_id", appointment.org_id)
      .maybeSingle<ServiceRow>(),
    supabase
      .from("staff")
      .select("id, name")
      .eq("id", appointment.staff_id)
      .eq("org_id", appointment.org_id)
      .maybeSingle<StaffRow>(),
  ]);

  if (clientError || !client) {
    throw new Error("non_retryable:client_not_found");
  }

  if (serviceError || !service) {
    throw new Error("non_retryable:service_not_found");
  }

  if (staffError || !staff) {
    throw new Error("non_retryable:staff_not_found");
  }

  const { data: organizationProfile } = await supabase
    .from("organization_profiles")
    .select("name, default_locale")
    .eq("org_id", appointment.org_id)
    .maybeSingle<{ name: string; default_locale?: string | null }>();

  return {
    appointment,
    client,
    service,
    staff,
    organizationName:
      organizationProfile?.name?.trim() || organizationLabel(appointment.org_id),
    locale: normalizeNotificationLocale(
      job.locale ?? organizationProfile?.default_locale,
    ),
  };
}

async function getBusinessRecipientEmail(
  supabase: SupabaseAdminClient,
  orgId: string,
) {
  const { data, error } = await supabase.rpc(
    "get_business_notification_recipient_email",
    {
      p_org_id: orgId,
    },
  );

  if (error) {
    throw new Error("non_retryable:business_email_missing");
  }

  return typeof data === "string" && data.includes("@") ? data : null;
}

async function processBookingConfirmationJob(
  supabase: SupabaseAdminClient,
  job: ClaimedNotificationJob,
): Promise<ProcessResult> {
  const { appointment, client, service, staff, organizationName, locale } =
    await getNotificationData(supabase, job);
  const recipient = maskEmail(client.email);

  if (!client.email) {
    return {
      status: "skipped",
      recipient,
      errorMessage: "non_retryable:client_email_missing",
    };
  }

  const providerMessageId = await sendEmailWithResend({
    to: client.email,
    subject: getBookingConfirmationEmailSubject(locale),
    html: renderBookingConfirmationEmail({
      organizationName,
      clientName: clientDisplayName(client),
      serviceName: service.name,
      staffName: staff.name,
      startAt: appointment.start_at,
      endAt: appointment.end_at,
      durationMinutes: service.duration_minutes,
      locale,
    }),
    idempotencyKey: `notification-job-${job.id}`,
  });

  return {
    status: "sent",
    recipient,
    providerMessageId,
  };
}

async function processAppointmentReminderJob(
  supabase: SupabaseAdminClient,
  job: ClaimedNotificationJob,
): Promise<ProcessResult> {
  const { appointment, client, service, staff, organizationName, locale } =
    await getNotificationData(supabase, job);
  const recipient = maskEmail(client.email);

  if (appointment.status !== "confirmed") {
    return {
      status: "skipped",
      recipient,
      errorMessage: "non_retryable:appointment_not_confirmed",
    };
  }

  if (new Date(appointment.start_at).getTime() <= Date.now()) {
    return {
      status: "skipped",
      recipient,
      errorMessage: "non_retryable:appointment_already_started",
    };
  }

  if (!client.email) {
    return {
      status: "skipped",
      recipient,
      errorMessage: "non_retryable:client_email_missing",
    };
  }

  const providerMessageId = await sendEmailWithResend({
    to: client.email,
    subject: getAppointmentReminderEmailSubject(locale),
    html: renderAppointmentReminderEmail({
      organizationName,
      clientName: clientDisplayName(client),
      serviceName: service.name,
      staffName: staff.name,
      startAt: appointment.start_at,
      endAt: appointment.end_at,
      durationMinutes: service.duration_minutes,
      locale,
    }),
    idempotencyKey: `notification-job-${job.id}`,
  });

  return {
    status: "sent",
    recipient,
    providerMessageId,
  };
}

async function processBusinessBookingNotificationJob(
  supabase: SupabaseAdminClient,
  job: ClaimedNotificationJob,
): Promise<ProcessResult> {
  const { appointment, client, service, staff, organizationName, locale } =
    await getNotificationData(supabase, job);
  const recipientEmail = await getBusinessRecipientEmail(
    supabase,
    appointment.org_id,
  );
  const recipient = maskEmail(recipientEmail);

  if (!recipientEmail) {
    return {
      status: "skipped",
      recipient,
      errorMessage: "non_retryable:business_email_missing",
    };
  }

  const providerMessageId = await sendEmailWithResend({
    to: recipientEmail,
    subject: getBusinessBookingNotificationEmailSubject(locale),
    html: renderBusinessBookingNotificationEmail({
      organizationName,
      clientName: clientDisplayName(client),
      clientPhone: client.phone,
      clientEmail: client.email,
      serviceName: service.name,
      staffName: staff.name,
      startAt: appointment.start_at,
      endAt: appointment.end_at,
      durationMinutes: service.duration_minutes,
      notes: appointment.notes,
      locale,
    }),
    idempotencyKey: `notification-job-${job.id}`,
  });

  return {
    status: "sent",
    recipient,
    providerMessageId,
  };
}

async function processNotificationJob(
  supabase: SupabaseAdminClient,
  job: ClaimedNotificationJob,
) {
  if (job.type === "booking_confirmation") {
    return processBookingConfirmationJob(supabase, job);
  }

  if (job.type === "appointment_reminder") {
    return processAppointmentReminderJob(supabase, job);
  }

  if (job.type === "business_booking_notification") {
    return processBusinessBookingNotificationJob(supabase, job);
  }

  throw new Error(`non_retryable:unsupported_notification_type:${job.type}`);
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const token = getBearerToken(request);

  if (!cronSecret || !token || token !== cronSecret) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("claim_due_notification_jobs", {
      batch_size: 50,
    });

    if (error) {
      console.error("Notification job claim failed:", error);
      return jsonError("Notification jobs could not be claimed.", 500);
    }

    const jobs = (data ?? []) as ClaimedNotificationJob[];
    let sentCount = 0;
    let retryScheduledCount = 0;
    let failedCount = 0;

    for (const job of jobs) {
      try {
        const result = await processNotificationJob(supabase, job);

        if (result.status === "sent") {
          await markJobSent(supabase, job.id);
          await insertNotificationLog({
            supabase,
            job,
            status: "sent",
            recipient: result.recipient,
            providerMessageId: result.providerMessageId,
          });
          sentCount += 1;
          continue;
        }

        await markJobFailed(supabase, job, result.errorMessage);
        await insertNotificationLog({
          supabase,
          job,
          status: "skipped",
          recipient: result.recipient,
          errorMessage: result.errorMessage,
        });
        failedCount += 1;
      } catch (jobError) {
        const errorMessage = safeErrorMessage(jobError);
        const retryable = shouldRetryNotificationError(job, errorMessage);

        console.error("Notification job processing failed:", {
          jobId: job.id,
          type: job.type,
          error: errorMessage,
        });

        if (retryable) {
          try {
            await scheduleJobRetry(supabase, job, errorMessage);
            retryScheduledCount += 1;
          } catch {
            failedCount += 1;
          }
        } else {
          await markJobFailed(supabase, job, errorMessage);
          failedCount += 1;
        }

        await insertNotificationLog({
          supabase,
          job,
          status: isNonRetryableError(errorMessage) ? "skipped" : "failed",
          recipient: null,
          errorMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      claimedCount: jobs.length,
      sentCount,
      retryScheduledCount,
      failedCount,
    });
  } catch (error) {
    if (error instanceof SupabaseAdminConfigError) {
      console.error("Notification cron admin config missing:", error);
      return jsonError("Server configuration is missing.", 500);
    }

    console.error("Notification cron failed:", error);
    return jsonError("Notification cron failed.", 500);
  }
}


