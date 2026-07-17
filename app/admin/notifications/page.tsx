import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { getNotificationLogs } from "./queries";
import type { NotificationLogListItem } from "./queries";

const TYPE_LABELS: Record<string, string> = {
  booking_confirmation: "Randevu Onayı",
  appointment_reminder: "Randevu Hatırlatması",
  business_booking_notification: "Yeni Randevu Bildirimi",
};

const STATUS_LABELS: Record<string, string> = {
  sent: "Gönderildi",
  failed: "Başarısız",
  skipped: "Atlandı",
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "E-posta",
};

const PROVIDER_LABELS: Record<string, string> = {
  resend: "Resend",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

function labelFor(map: Record<string, string>, value: string) {
  return map[value] ?? value;
}

function statusClassName(status: string) {
  if (status === "sent") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "skipped") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  return "border-red-500/30 bg-red-500/10 text-red-300";
}

function NotificationLogCard({ log }: { log: NotificationLogListItem }) {
  return (
    <article className="rounded-2xl border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">
              {labelFor(TYPE_LABELS, log.type)}
            </h2>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClassName(
                log.status,
              )}`}
            >
              {labelFor(STATUS_LABELS, log.status)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {DATE_FORMATTER.format(new Date(log.created_at))}
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          Deneme #{log.attempt_number}
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Alıcı</dt>
          <dd className="font-medium">{log.recipient ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Kanal</dt>
          <dd className="font-medium">{labelFor(CHANNEL_LABELS, log.channel)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Provider</dt>
          <dd className="font-medium">{labelFor(PROVIDER_LABELS, log.provider)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Provider Mesaj ID</dt>
          <dd className="break-all font-medium">
            {log.provider_message_id ?? "-"}
          </dd>
        </div>
      </dl>

      {log.error_message && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <div className="text-xs font-medium text-red-300">Hata</div>
          <p className="mt-1 max-h-24 overflow-auto break-words text-sm text-red-200">
            {log.error_message}
          </p>
        </div>
      )}
    </article>
  );
}

export default async function AdminNotificationsPage() {
  const context = await getCurrentOrgContext("admin-notifications-page");
  const logs = await getNotificationLogs(context);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bildirimler</h1>
        <p className="text-sm text-muted-foreground">
          Son 100 bildirim gönderim kaydını görüntüleyin.
        </p>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="Henüz bildirim kaydı bulunmuyor." />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <NotificationLogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
