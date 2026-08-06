import { EmptyState } from "@/components/ui/empty-state";
import { getAdminMessages } from "@/lib/i18n/admin";
import { isLocale } from "@/lib/i18n/constants";
import { getCurrentOrgContext } from "@/lib/supabase/org";
import { getNotificationLogs } from "@/app/admin/notifications/queries";
import type { NotificationLogListItem } from "@/app/admin/notifications/queries";
import { notFound } from "next/navigation";

type LocalizedAdminNotificationsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

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

function NotificationLogCard({
  log,
  messages,
  dateFormatter,
}: {
  log: NotificationLogListItem;
  messages: ReturnType<typeof getAdminMessages>["notifications"];
  dateFormatter: Intl.DateTimeFormat;
}) {
  return (
    <article className="min-w-0 rounded-2xl border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words text-base font-semibold">
              {labelFor(messages.typeLabels, log.type)}
            </h2>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClassName(
                log.status,
              )}`}
            >
              {labelFor(messages.statusLabels, log.status)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {dateFormatter.format(new Date(log.created_at))}
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          {messages.attempt(log.attempt_number)}
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">{messages.recipient}</dt>
          <dd className="break-all font-medium">{log.recipient ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{messages.channel}</dt>
          <dd className="font-medium">
            {labelFor(messages.channelLabels, log.channel)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{messages.provider}</dt>
          <dd className="font-medium">
            {labelFor(messages.providerLabels, log.provider)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{messages.providerMessageId}</dt>
          <dd className="break-all font-medium">
            {log.provider_message_id ?? "-"}
          </dd>
        </div>
      </dl>

      {log.error_message && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <div className="text-xs font-medium text-red-300">{messages.error}</div>
          <p className="dark-scrollbar mt-1 max-h-24 overflow-auto break-words text-sm text-red-200">
            {log.error_message}
          </p>
        </div>
      )}
    </article>
  );
}

export default async function LocalizedAdminNotificationsPage({
  params,
}: LocalizedAdminNotificationsPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const messages = getAdminMessages(locale).notifications;
  const context = await getCurrentOrgContext("admin-notifications-page");
  const logs = await getNotificationLogs(context);
  const dateFormatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{messages.title}</h1>
        <p className="text-sm text-muted-foreground">{messages.description}</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState title={messages.emptyTitle} />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <NotificationLogCard
              key={log.id}
              log={log}
              messages={messages}
              dateFormatter={dateFormatter}
            />
          ))}
        </div>
      )}
    </div>
  );
}
