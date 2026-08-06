"use client";

import { useState } from "react";
import { ServiceTable } from "./ServiceTable";
import { CreateTable } from "./CreateTable";
import { Service } from "../../../types";
import { getAdminMessages, type AdminMessages } from "@/lib/i18n/admin";

export function ServiceClient({
  services,
  messages,
}: {
  services: Service[];
  messages?: AdminMessages;
}) {
  const t = messages ?? getAdminMessages();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  return (
    <>
      {message && (
        <div
          className={`mb-4 text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}
        >
          {message.text}
        </div>
      )}
      <ServiceTable services={services} setMessage={setMessage} messages={t} />
      <div className="mt-12">
        <h2 className="text-lg font-bold mb-4">{t.services.createTitle}</h2>
        <CreateTable setMessage={setMessage} messages={t} />
      </div>
    </>
  );
}

