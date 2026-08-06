"use client";
import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import { EmptyState } from "@/components/ui/empty-state";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Message, Service } from "../../../types";
import type { AdminMessages } from "@/lib/i18n/admin";

export const ServiceTable = ({
  services,
  setMessage,
  messages,
}: {
  services: Service[];
  setMessage: React.Dispatch<React.SetStateAction<Message>>;
  messages: AdminMessages;
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  if (services.length === 0) {
    return (
      <EmptyState
        title={messages.services.emptyTitle}
        description={messages.services.emptyDescription}
      />
    );
  }

  async function handleDelete(id: string) {
    setLoadingId(id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, messages.services.deleteFailed),
        );
      }

      setMessage({ type: "success", text: messages.services.deleteSuccess });
      router.refresh();
    } catch (error) {
      console.error("Error deleting service:", error);
      setMessage({
        type: "error",
        text: getClientErrorMessage(error, messages.services.deleteFailed),
      });
    } finally {
      setLoadingId(null);
    }
  }
  async function handleActiveInactive(id: string, currentIsActive: boolean) {
    setLoadingId(id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !currentIsActive }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            messages.services.statusUpdateFailed,
          ),
        );
      }

      setMessage({
        type: "success",
        text: messages.services.statusUpdateSuccess,
      });
      router.refresh();
    } catch (error) {
      console.error("Error updating service status:", error);
      setMessage({
        type: "error",
        text: getClientErrorMessage(
          error,
          messages.services.statusUpdateFailed,
        ),
      });
    } finally {
      setLoadingId(null);
    }
  }
  return (
    <div className="space-y-3">
      {services.map((service) => (
        <article
          key={service.id}
          className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <h3 className="break-words text-base font-semibold">{service.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {messages.services.durationText(service.duration_minutes)}
            </p>
            <span
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs ${
                service.is_active
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-slate-500/10 text-slate-300"
              }`}
            >
              {service.is_active
                ? messages.services.active
                : messages.services.passive}
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => handleDelete(service.id)}
              disabled={loadingId === service.id}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
            >
              {loadingId === service.id
                ? messages.services.deleting
                : messages.services.delete}
            </button>
            <button
              type="button"
              onClick={() =>
                handleActiveInactive(service.id, service.is_active)
              }
              disabled={loadingId === service.id}
              className="inline-flex min-h-11 items-center justify-center rounded-md border bg-slate-900 px-3 py-2 text-sm disabled:opacity-50"
            >
              {loadingId === service.id
                ? messages.services.updating
                : service.is_active
                  ? messages.services.deactivate
                  : messages.services.activate}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};

