"use client";
import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import { EmptyState } from "@/components/ui/empty-state";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Message, Service } from "../../../types";

export const ServiceTable = ({
  services,
  setMessage,
}: {
  services: Service[];
  setMessage: React.Dispatch<React.SetStateAction<Message>>;
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  if (services.length === 0) {
    return (
      <EmptyState
        title="Henüz hizmet bulunmuyor."
        description="İlk hizmetinizi oluşturduğunuzda burada listelenir."
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
        throw new Error(await readApiErrorMessage(response, "Hizmet silinemedi."));
      }

      setMessage({ type: "success", text: "Hizmet başarıyla silindi." });
      router.refresh();
    } catch (error) {
      console.error("Error deleting service:", error);
      setMessage({
        type: "error",
        text: getClientErrorMessage(error, "Hizmet silinemedi."),
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
          await readApiErrorMessage(response, "Hizmet durumu güncellenemedi."),
        );
      }

      setMessage({
        type: "success",
        text: "Hizmet durumu başarıyla güncellendi.",
      });
      router.refresh();
    } catch (error) {
      console.error("Error updating service status:", error);
      setMessage({
        type: "error",
        text:
          getClientErrorMessage(error, "Hizmet durumu güncellenemedi."),
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
              Süre: {service.duration_minutes} dakika
            </p>
            <span
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs ${
                service.is_active
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-slate-500/10 text-slate-300"
              }`}
            >
              {service.is_active ? "Aktif" : "Pasif"}
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => handleDelete(service.id)}
              disabled={loadingId === service.id}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
            >
              {loadingId === service.id ? "Siliniyor..." : "Sil"}
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
                ? "Güncelleniyor..."
                : service.is_active
                  ? "Pasifleştir"
                  : "Aktifleştir"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};

