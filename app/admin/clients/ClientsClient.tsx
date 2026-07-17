"use client";

import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";
import type { Client, Message } from "../../../types";
import { ClientDialog } from "./ClientDialog";
import type { ClientFormValues } from "./ClientForm";
import { ClientsTable } from "./ClientsTable";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function ClientsClient({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase("tr-TR"));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [values, setValues] = useState<ClientFormValues>(emptyValues());
  const [loading, setLoading] = useState(false);
  const [inviteLoadingId, setInviteLoadingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);

  const filteredClients = deferredSearch
    ? clients.filter((client) =>
        [client.first_name, client.last_name, client.phone, client.email].some((value) =>
          value?.toLocaleLowerCase("tr-TR").includes(deferredSearch),
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
      setMessage({ type: "error", text: "Ad, soyad ve e-posta alanları zorunludur." });
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setMessage({ type: "error", text: "Geçerli bir e-posta adresi girin." });
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
        throw new Error(await readApiErrorMessage(response, "Müşteri kaydedilemedi."));
      }

      setIsDialogOpen(false);
      setEditingClient(null);
      setMessage({
        type: "success",
        text: editingClient ? "Müşteri güncellendi." : "Müşteri eklendi.",
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: getClientErrorMessage(error, "Müşteri kaydedilemedi."),
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
          await readApiErrorMessage(response, "Müşteri durumu güncellenemedi."),
        );
      }

      setMessage({
        type: "success",
        text: client.is_active ? "Müşteri pasife alındı." : "Müşteri aktif edildi.",
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: getClientErrorMessage(error, "Müşteri durumu güncellenemedi."),
      });
    } finally {
      setInviteLoadingId(null);
    }
  }

  async function handleInvite(client: Client) {
    if (!client.email || !EMAIL_PATTERN.test(client.email)) {
      setMessage({
        type: "error",
        text: "Bu müşteri için geçerli bir e-posta adresi gerekli.",
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
        throw new Error(
          await readApiErrorMessage(
            response,
            "Davet gönderilirken bir hata oluştu.",
          ),
        );
      }

      setMessage({ type: "success", text: "Hesap daveti gönderildi." });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          getClientErrorMessage(error, "Davet gönderilirken bir hata oluştu."),
      });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Müşteriler</h1>
          <p className="text-sm text-muted-foreground">Müşteri kayıtlarını yönetin.</p>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Yeni Müşteri
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
          placeholder="Ad, soyad, telefon veya e-posta ara"
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground"
        />
      </div>

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Henüz müşteri bulunmuyor.
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Sonuç bulunamadı.
        </div>
      ) : (
        <ClientsTable
          clients={filteredClients}
          inviteLoadingId={inviteLoadingId}
          loadingId={loadingId}
          onEdit={openEditDialog}
          onInvite={handleInvite}
          onToggleActive={handleToggleActive}
        />
      )}

      <ClientDialog
        isOpen={isDialogOpen}
        loading={loading}
        onChange={setValues}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        title={editingClient ? "Müşteriyi Düzenle" : "Yeni Müşteri"}
        values={values}
      />
    </div>
  );
}


