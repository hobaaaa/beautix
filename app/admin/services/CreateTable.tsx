"use client";

import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import { useState } from "react";
import { Message } from "../../../types";
import { useRouter } from "next/navigation";
import type { AdminMessages } from "@/lib/i18n/admin";

export const CreateTable = ({
  setMessage,
  messages,
}: {
  setMessage: React.Dispatch<React.SetStateAction<Message>>;
  messages: AdminMessages;
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
        throw new Error(messages.services.nameRequired);
      }

      const duration = Number(durationString);

      if (!Number.isInteger(duration) || duration <= 0 || duration > 600) {
        throw new Error(messages.services.durationInvalid);
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

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, messages.services.createFailed),
        );
      }
      setMessage({ type: "success", text: messages.services.createSuccess });

      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: getClientErrorMessage(error, messages.services.genericError),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="">
          {messages.services.nameLabel}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="min-h-11 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="duration_minutes">{messages.services.durationLabel}</label>
        <input
          type="number"
          id="duration_minutes"
          name="duration_minutes"
          required
          className="min-h-11 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="min-h-11 w-full rounded bg-blue-500 px-4 py-2 text-white sm:w-auto"
      >
        {loading ? messages.services.creating : messages.services.createButton}
      </button>
    </form>
  );
};

