"use client";

import Link from "next/link";
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
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="hidden grid-cols-[1fr_1fr_1fr_1.2fr_1.2fr_130px_360px] gap-3 border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground xl:grid">
          <div>Ad</div>
          <div>Soyad</div>
          <div>Telefon</div>
          <div>E-posta</div>
          <div>Adres</div>
          <div>Oluşturulma</div>
          <div className="text-right">İşlemler</div>
        </div>

        <div className="divide-y divide-border">
          {clients.map((client) => (
            <div
              key={client.id}
              className="grid gap-4 px-4 py-4 xl:grid-cols-[1fr_1fr_1fr_1.2fr_1.2fr_130px_360px] xl:items-center xl:gap-3"
            >
              <div>
                <div className="text-xs text-muted-foreground xl:hidden">Ad</div>
                <div className="font-medium">{client.first_name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground xl:hidden">Soyad</div>
                <div>{client.last_name || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground xl:hidden">Telefon</div>
                <div>{client.phone || "-"}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground xl:hidden">E-posta</div>
                <div className="truncate">{client.email || "-"}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground xl:hidden">Adres</div>
                <div className="line-clamp-2 text-sm text-muted-foreground">
                  {client.address || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground xl:hidden">Oluşturulma</div>
                <div className="text-sm">{formatDate(client.created_at)}</div>
              </div>
              <div className="flex flex-wrap gap-2 xl:justify-end">
                <span className="w-full text-xs text-muted-foreground xl:text-right">
                  {client.user_id ? "Hesap aktif" : "Hesap oluşturulmamış"}
                </span>
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Randevular
                </Link>
                <button
                  type="button"
                  onClick={() => onInvite(client)}
                  disabled={
                    inviteLoadingId === client.id ||
                    loadingId === client.id ||
                    !client.is_active ||
                    !hasValidEmail(client)
                  }
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {inviteLoadingId === client.id
                    ? "Gönderiliyor..."
                    : client.user_id
                      ? "Daveti Yeniden Gönder"
                      : "Hesap Daveti Gönder"}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(client)}
                  disabled={loadingId === client.id}
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => onToggleActive(client)}
                  disabled={loadingId === client.id}
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                >
                  {loadingId === client.id
                    ? "Güncelleniyor..."
                    : client.is_active
                      ? "Pasife Al"
                      : "Aktif Et"}
                </button>
              </div>
            </div>
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
