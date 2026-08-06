"use client";

import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import type { AdminMessages } from "@/lib/i18n/admin";
import type { Locale } from "@/lib/i18n/constants";
import { Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useDeferredValue, useState } from "react";
import type { Client, Message } from "../../../types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ClientFormValues = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  birth_date: string;
};

type LocalizedClientsClientProps = {
  clients: Client[];
  locale: Locale;
  messages: AdminMessages["clients"];
};

function emptyValues(): ClientFormValues {
  return {
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    birth_date: "",
  };
}

function valuesFromClient(client: Client): ClientFormValues {
  return {
    first_name: client.first_name,
    last_name: client.last_name,
    phone: client.phone ?? "",
    email: client.email ?? "",
    address: client.address ?? "",
    notes: client.notes ?? "",
    birth_date: client.birth_date ?? "",
  };
}

function hasValidEmail(client: Client) {
  return Boolean(client.email && EMAIL_PATTERN.test(client.email));
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    dateStyle: "medium",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
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

function ClientForm({
  loading,
  messages,
  onCancel,
  onChange,
  onSubmit,
  submitLabel,
  values,
}: {
  loading: boolean;
  messages: AdminMessages["clients"];
  onCancel: () => void;
  onChange: (values: ClientFormValues) => void;
  onSubmit: () => void;
  submitLabel: string;
  values: ClientFormValues;
}) {
  function updateField(field: keyof ClientFormValues, value: string) {
    onChange({ ...values, [field]: value });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          {messages.firstName} <span className="text-red-400">*</span>
          <input
            value={values.first_name}
            onChange={(event) => updateField("first_name", event.target.value)}
            disabled={loading}
            autoComplete="given-name"
            className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
          />
        </label>

        <label className="space-y-2 text-sm font-medium">
          {messages.lastName} <span className="text-red-400">*</span>
          <input
            value={values.last_name}
            onChange={(event) => updateField("last_name", event.target.value)}
            disabled={loading}
            autoComplete="family-name"
            className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          {messages.phone}
          <input
            type="tel"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            disabled={loading}
            autoComplete="tel"
            placeholder="05xx xxx xx xx"
            className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
          />
        </label>

        <label className="space-y-2 text-sm font-medium">
          {messages.email} <span className="text-red-400">*</span>
          <input
            type="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            disabled={loading}
            autoComplete="email"
            className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium">
        {messages.address}
        <textarea
          value={values.address}
          onChange={(event) => updateField("address", event.target.value)}
          disabled={loading}
          autoComplete="street-address"
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          {messages.birthDate}
          <input
            type="date"
            value={values.birth_date}
            onChange={(event) => updateField("birth_date", event.target.value)}
            disabled={loading}
            className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium">
        {messages.notes}
        <textarea
          value={values.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          disabled={loading}
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
        />
      </label>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-50"
        >
          {messages.cancel}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? messages.saving : submitLabel}
        </button>
      </div>
    </form>
  );
}

function ClientDialog({
  isOpen,
  loading,
  messages,
  onChange,
  onClose,
  onSubmit,
  title,
  values,
}: {
  isOpen: boolean;
  loading: boolean;
  messages: AdminMessages["clients"];
  onChange: (values: ClientFormValues) => void;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  values: ClientFormValues;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
      <button
        type="button"
        onClick={loading ? undefined : onClose}
        className="absolute inset-0 bg-black/80"
        aria-label={messages.closeForm}
      />
      <section className="dark-scrollbar relative max-h-[calc(100dvh_-_2rem_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#1f1f1f] p-5 text-zinc-100 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-sm text-zinc-400">{messages.formDescription}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label={messages.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ClientForm
          loading={loading}
          messages={messages}
          onCancel={onClose}
          onChange={onChange}
          onSubmit={onSubmit}
          submitLabel={
            title === messages.createTitle ? messages.addClient : messages.saveChanges
          }
          values={values}
        />
      </section>
    </div>
  );
}

function ClientActions({
  client,
  inviteLoadingId,
  loadingId,
  locale,
  messages,
  onEdit,
  onInvite,
  onToggleActive,
}: {
  client: Client;
  inviteLoadingId: string | null;
  loadingId: string | null;
  locale: Locale;
  messages: AdminMessages["clients"];
  onEdit: (client: Client) => void;
  onInvite: (client: Client) => void;
  onToggleActive: (client: Client) => void;
}) {
  return (
    <details className="relative">
      <summary
        aria-label={messages.actions}
        className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-border text-lg leading-none transition hover:bg-muted [&::-webkit-details-marker]:hidden"
      >
        ...
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-xl">
        <Link
          href={`/${locale}/admin/clients/${client.id}`}
          className="block rounded-xl px-3 py-2 text-sm transition hover:bg-muted"
        >
          {messages.appointments}
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
            ? messages.sending
            : client.user_id
              ? messages.resendInvite
              : messages.sendInvite}
        </ActionButton>
        <ActionButton
          onClick={() => onEdit(client)}
          disabled={loadingId === client.id}
        >
          {messages.edit}
        </ActionButton>
        <ActionButton
          onClick={() => onToggleActive(client)}
          disabled={loadingId === client.id}
        >
          {loadingId === client.id
            ? messages.updating
            : client.is_active
              ? messages.deactivate
              : messages.activate}
        </ActionButton>
      </div>
    </details>
  );
}

function ClientSection({
  clients,
  inviteLoadingId,
  loadingId,
  locale,
  messages,
  onEdit,
  onInvite,
  onToggleActive,
  title,
}: {
  clients: Client[];
  inviteLoadingId: string | null;
  loadingId: string | null;
  locale: Locale;
  messages: AdminMessages["clients"];
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
                    {client.is_active ? messages.active : messages.inactive}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {messages.createdAt}: {formatDate(client.created_at, locale)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {client.user_id ? messages.accountActive : messages.accountMissing}
                </p>
              </div>

              <div className="min-w-0 space-y-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">{messages.phone}</div>
                  <div className="break-words font-medium">{client.phone || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{messages.email}</div>
                  <div className="break-all font-medium">{client.email || "-"}</div>
                </div>
              </div>

              <div className="min-w-0 text-sm">
                <div className="text-xs text-muted-foreground">{messages.address}</div>
                <div className="line-clamp-3 break-words text-muted-foreground">
                  {client.address || "-"}
                </div>
              </div>

              <div className="flex justify-end lg:justify-center">
                <ClientActions
                  client={client}
                  inviteLoadingId={inviteLoadingId}
                  loadingId={loadingId}
                  locale={locale}
                  messages={messages}
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

export function LocalizedClientsClient({
  clients,
  locale,
  messages,
}: LocalizedClientsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(
    search.trim().toLocaleLowerCase(locale === "en" ? "en-US" : "tr-TR"),
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [values, setValues] = useState<ClientFormValues>(emptyValues());
  const [loading, setLoading] = useState(false);
  const [inviteLoadingId, setInviteLoadingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);

  const filteredClients = deferredSearch
    ? clients.filter((client) =>
        [client.first_name, client.last_name, client.phone, client.email].some(
          (value) =>
            value
              ?.toLocaleLowerCase(locale === "en" ? "en-US" : "tr-TR")
              .includes(deferredSearch),
        ),
      )
    : clients;

  function openCreateDialog() {
    setEditingClient(null);
    setValues(emptyValues());
    setMessage(null);
    setIsDialogOpen(true);
  }

  function openEditDialog(client: Client) {
    setEditingClient(client);
    setValues(valuesFromClient(client));
    setMessage(null);
    setIsDialogOpen(true);
  }

  function closeDialog() {
    if (loading) return;
    setIsDialogOpen(false);
    setEditingClient(null);
  }

  async function handleSubmit() {
    const firstName = values.first_name.trim();
    const lastName = values.last_name.trim();
    const email = values.email.trim().toLowerCase();

    if (!firstName || !lastName || !email) {
      setMessage({ type: "error", text: messages.requiredFields });
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setMessage({ type: "error", text: messages.invalidEmail });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        editingClient ? `/api/admin/clients/${editingClient.id}` : "/api/admin/clients",
        {
          method: editingClient ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            first_name: firstName,
            last_name: lastName,
            email,
            ...(editingClient ? { is_active: editingClient.is_active } : {}),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, messages.saveFailed));
      }

      setIsDialogOpen(false);
      setEditingClient(null);
      setMessage({
        type: "success",
        text: editingClient ? messages.updateSuccess : messages.createSuccess,
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: getClientErrorMessage(error, messages.saveFailed),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(client: Client) {
    setInviteLoadingId(client.id);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !client.is_active }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, messages.statusUpdateFailed),
        );
      }

      setMessage({
        type: "success",
        text: client.is_active ? messages.deactivated : messages.activated,
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: getClientErrorMessage(error, messages.statusUpdateFailed),
      });
    } finally {
      setInviteLoadingId(null);
    }
  }

  async function handleInvite(client: Client) {
    if (!client.email || !EMAIL_PATTERN.test(client.email)) {
      setMessage({
        type: "error",
        text: messages.inviteEmailRequired,
      });
      return;
    }

    setLoadingId(client.id);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/clients/${client.id}/invite`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, messages.inviteFailed));
      }

      setMessage({ type: "success", text: messages.inviteSuccess });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: getClientErrorMessage(error, messages.inviteFailed),
      });
    } finally {
      setLoadingId(null);
    }
  }

  const activeClients = filteredClients.filter((client) => client.is_active);
  const inactiveClients = filteredClients.filter((client) => !client.is_active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{messages.title}</h1>
          <p className="text-sm text-muted-foreground">{messages.description}</p>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          {messages.newClient}
        </button>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-300"
              : "border-red-900/60 bg-red-950/40 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={messages.searchPlaceholder}
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground"
        />
      </div>

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {messages.emptyTitle}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {messages.noResults}
        </div>
      ) : (
        <div className="space-y-8">
          <ClientSection
            clients={activeClients}
            inviteLoadingId={inviteLoadingId}
            loadingId={loadingId}
            locale={locale}
            messages={messages}
            onEdit={openEditDialog}
            onInvite={handleInvite}
            onToggleActive={handleToggleActive}
            title={messages.activeSection}
          />
          <ClientSection
            clients={inactiveClients}
            inviteLoadingId={inviteLoadingId}
            loadingId={loadingId}
            locale={locale}
            messages={messages}
            onEdit={openEditDialog}
            onInvite={handleInvite}
            onToggleActive={handleToggleActive}
            title={messages.inactiveSection}
          />
        </div>
      )}

      <ClientDialog
        isOpen={isDialogOpen}
        loading={loading}
        messages={messages}
        onChange={setValues}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        title={editingClient ? messages.editTitle : messages.createTitle}
        values={values}
      />
    </div>
  );
}
