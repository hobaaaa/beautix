"use client";
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
    return <div>Henüz hizmet bulunmuyor.</div>;
  }

  async function handleDelete(id: string) {
    setLoadingId(id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: "DELETE",
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Hizmet silinemedi.");
      }

      setMessage({ type: "success", text: "Hizmet başarıyla silindi." });
      router.refresh();
    } catch (error) {
      console.error("Error deleting service:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Hizmet silinemedi.",
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
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Hizmet durumu güncellenemedi.");
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
          error instanceof Error
            ? error.message
            : "Hizmet durumu güncellenemedi.",
      });
    } finally {
      setLoadingId(null);
    }
  }
  return (
    <div className="space-y-4">
      <table className="w-full border rounded-lg">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Ad</th>
            <th className="p-2 text-left">Süre (dakika)</th>
            <th className="p-2">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id} className="border-b">
              <td className="p-2">{service.name}</td>
              <td className="p-2">{service.duration_minutes}</td>
              <td className="p-2 text-center">
                <button
                  onClick={() => handleDelete(service.id)}
                  disabled={loadingId === service.id}
                  className="text-red-600 hover:underline disabled:opacity-50 rounded-md border px-3 py-2 text-sm disabled:opacity-50 mr-4"
                >
                  {loadingId === service.id ? "Siliniyor..." : "Sil"}
                </button>
                <button
                  onClick={() =>
                    handleActiveInactive(service.id, service.is_active)
                  }
                  disabled={loadingId === service.id}
                  className="text-gray-500 hover:underline disabled:opacity-50 rounded-md border px-3 py-2 text-sm disabled:opacity-50 bg-slate-900 mr-4"
                >
                  {loadingId === service.id
                    ? "Güncelleniyor..."
                    : service.is_active
                      ? "Pasifleştir"
                      : "Aktifleştir"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
