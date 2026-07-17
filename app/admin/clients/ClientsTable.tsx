"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Client } from "../../../types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasValidEmail(client: Client) {
  return Boolean(client.email && EMAIL_PATTERN.test(client.email));
}

function ActionButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function ClientActions({
  client,
  inviteLoadingId,
  loadingId,
  onEdit,
  onInvite,
  onToggleActive,
}: {
  client: Client;
  inviteLoadingId: string | null;
  loadingId: string | null;
  onEdit: (client: Client) => void;
  onInvite: (client: Client) => void;
  onToggleActive: (client: Client) => void;
}) {
  return (
    <details className="relative">
      <summary
        aria-label="Müşteri işlemleri"
        className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-border text-lg leading-none transition hover:bg-muted [&::-webkit-details-marker]:hidden"
      >
        ...
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-xl">
        <Link
          href={`/admin/clients/${client.id}`}
          className="block rounded-xl px-3 py-2 text-sm transition hover:bg-muted"
        >
          Randevular
        </Link>
        <ActionButton
          onClick={() => onInvite(client)}
          disabled={
            inviteLoadingId === client.id ||
            loadingId === client.id ||
            !client.is_active ||
            !hasValidEmail(client)
          }
        >
          {inviteLoadingId === client.id
            ? "Gönderiliyor..."
            : client.user_id
              ? "Daveti Yeniden Gönder"
              : "Hesap Daveti Gönder"}
        </ActionButton>
        <ActionButton
          onClick={() => onEdit(client)}
          disabled={loadingId === client.id}
        >
          Düzenle
        </ActionButton>
        <ActionButton
          onClick={() => onToggleActive(client)}
          disabled={loadingId === client.id}
        >
          {loadingId === client.id
            ? "Güncelleniyor..."
            : client.is_active
              ? "Pasife Al"
              : "Aktif Et"}
        </ActionButton>
      </div>
    </details>
  );
}

function ClientSection({
  clients,
  inviteLoadingId,
  loadingId,
  onEdit,
  onInvite,
  onToggleActive,
  title,
}: {
  clients: Client[];
  inviteLoadingId: string | null;
  loadingId: string | null;
  onEdit: (client: Client) => void;
  onInvite: (client: Client) => void;
  onToggleActive: (client: Client) => void;
  title: string;
}) {
  if (clients.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="overflow-visible rounded-2xl border border-border">
        <div className="divide-y divide-border">
          {clients.map((client) => (
            <article
              key={client.id}
              className="grid min-w-0 gap-4 px-4 py-5 lg:grid-cols-[minmax(180px,1.1fr)_minmax(260px,1.7fr)_minmax(140px,0.8fr)_auto] lg:items-start"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold">
                    {client.first_name} {client.last_name}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      client.is_active
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-slate-500/10 text-slate-300"
                    }`}
                  >
                    {client.is_active ? "Aktif" : "Pasif"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Oluşturulma: {formatDate(client.created_at)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {client.user_id ? "Hesap aktif" : "Hesap oluşturulmamış"}
                </p>
              </div>

              <div className="min-w-0 space-y-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Telefon</div>
                  <div className="break-words font-medium">{client.phone || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">E-posta</div>
                  <div className="break-all font-medium">{client.email || "-"}</div>
                </div>
              </div>

              <div className="min-w-0 text-sm">
                <div className="text-xs text-muted-foreground">Adres</div>
                <div className="line-clamp-3 break-words text-muted-foreground">
                  {client.address || "-"}
                </div>
              </div>

              <div className="flex justify-end lg:justify-center">
                <ClientActions
                  client={client}
                  inviteLoadingId={inviteLoadingId}
                  loadingId={loadingId}
                  onEdit={onEdit}
                  onInvite={onInvite}
                  onToggleActive={onToggleActive}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClientsTable({
  clients,
  inviteLoadingId,
  loadingId,
  onEdit,
  onInvite,
  onToggleActive,
}: {
  clients: Client[];
  inviteLoadingId: string | null;
  loadingId: string | null;
  onEdit: (client: Client) => void;
  onInvite: (client: Client) => void;
  onToggleActive: (client: Client) => void;
}) {
  const activeClients = clients.filter((client) => client.is_active);
  const inactiveClients = clients.filter((client) => !client.is_active);

  return (
    <div className="space-y-8">
      <ClientSection
        clients={activeClients}
        inviteLoadingId={inviteLoadingId}
        loadingId={loadingId}
        onEdit={onEdit}
        onInvite={onInvite}
        onToggleActive={onToggleActive}
        title="Aktif Müşteriler"
      />
      <ClientSection
        clients={inactiveClients}
        inviteLoadingId={inviteLoadingId}
        loadingId={loadingId}
        onEdit={onEdit}
        onInvite={onInvite}
        onToggleActive={onToggleActive}
        title="Pasif Müşteriler"
      />
    </div>
  );
}
