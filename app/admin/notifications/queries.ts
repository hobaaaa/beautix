import "server-only";

import { getCurrentOrgContext } from "@/lib/supabase/org";
import type { OrgContext } from "@/lib/supabase/org";

export type NotificationLogListItem = {
  id: string;
  org_id: string;
  notification_job_id: string;
  appointment_id: string;
  client_id: string;
  type: string;
  channel: string;
  provider: string;
  status: string;
  attempt_number: number;
  recipient: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  created_at: string;
};

function normalizeNotificationLogs(value: unknown): NotificationLogListItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;

      if (
        typeof row.id !== "string" ||
        typeof row.org_id !== "string" ||
        typeof row.notification_job_id !== "string" ||
        typeof row.appointment_id !== "string" ||
        typeof row.client_id !== "string" ||
        typeof row.type !== "string" ||
        typeof row.channel !== "string" ||
        typeof row.provider !== "string" ||
        typeof row.status !== "string" ||
        typeof row.attempt_number !== "number" ||
        typeof row.created_at !== "string"
      ) {
        return null;
      }

      return {
        id: row.id,
        org_id: row.org_id,
        notification_job_id: row.notification_job_id,
        appointment_id: row.appointment_id,
        client_id: row.client_id,
        type: row.type,
        channel: row.channel,
        provider: row.provider,
        status: row.status,
        attempt_number: row.attempt_number,
        recipient: typeof row.recipient === "string" ? row.recipient : null,
        provider_message_id:
          typeof row.provider_message_id === "string"
            ? row.provider_message_id
            : null,
        error_message:
          typeof row.error_message === "string" ? row.error_message : null,
        created_at: row.created_at,
      };
    })
    .filter((item): item is NotificationLogListItem => item !== null);
}

export async function getNotificationLogs(
  context?: OrgContext,
): Promise<NotificationLogListItem[]> {
  const { supabase, orgId } =
    context ?? (await getCurrentOrgContext("admin-notifications-page"));

  const { data, error } = await supabase
    .from("notification_logs")
    .select(
      "id, org_id, notification_job_id, appointment_id, client_id, type, channel, provider, status, attempt_number, recipient, provider_message_id, error_message, created_at",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return normalizeNotificationLogs(data);
}
