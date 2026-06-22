"use client";

import { useState } from "react";
import { ServiceTable } from "./ServiceTable";
import { CreateTable } from "./CreateTable";
import { Service } from "../../../types";

export function ServiceClient({ services }: { services: Service[] }) {
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
      <ServiceTable services={services} setMessage={setMessage} />
      <div className="mt-12">
        <h2 className="text-lg font-bold mb-4">Yeni Hizmet Oluştur</h2>
        <CreateTable setMessage={setMessage} />
      </div>
    </>
  );
}
