"use client";

import { useState } from "react";
import { Message } from "../../../types";
import { useRouter } from "next/navigation";

export const CreateTable = ({
  setMessage,
}: {
  setMessage: React.Dispatch<React.SetStateAction<Message>>;
}) => {
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function action(formData: FormData) {
    setLoading(true);
    setMessage(null);
    try {
      const name = formData.get("name") as string;
      const durationString = formData.get("duration_minutes") as string;

      if (typeof name !== "string" || !name.trim()) {
        throw new Error("Hizmet adı zorunludur.");
      }

      const duration = Number(durationString);

      if (!Number.isInteger(duration) || duration <= 0 || duration > 600) {
        throw new Error("Süre 1 ile 600 dakika arasında olmalıdır.");
      }

      const payload = {
        name: name.trim(),
        duration_minutes: duration,
      };

      const response = await fetch("/api/admin/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Hizmet oluşturulamadı.");
      }
      setMessage({ type: "success", text: "Hizmet başarıyla oluşturuldu." });

      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Bir hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="">
          Hizmet Adı:
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="border border-gray-300 rounded px-2 py-1 w-full"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="duration_minutes">Süre (dakika):</label>
        <input
          type="number"
          id="duration_minutes"
          name="duration_minutes"
          required
          className="border border-gray-300 rounded px-2 py-1 w-full"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Oluşturuluyor..." : "Hizmet Oluştur"}
      </button>
    </form>
  );
};
