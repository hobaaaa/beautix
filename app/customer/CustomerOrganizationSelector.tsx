"use client";

import type { CustomerOrganization } from "./queries";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function organizationLabel(organization: CustomerOrganization) {
  return `İşletme ${organization.org_id.slice(0, 8)}`;
}

export function CustomerOrganizationSelector({
  organizations,
}: {
  organizations: CustomerOrganization[];
}) {
  const router = useRouter();
  const [loadingOrgId, setLoadingOrgId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(orgId: string) {
    setLoadingOrgId(orgId);
    setError(null);

    try {
      const response = await fetch("/api/customer/select-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error || "İşletme seçilemedi.");
      }

      router.refresh();
    } catch (selectError) {
      setError(
        selectError instanceof Error ? selectError.message : "İşletme seçilemedi.",
      );
      setLoadingOrgId(null);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400">
        <Building2 className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold">İşletme Seçin</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Bu hesap birden fazla işletmeye bağlı. Devam etmek istediğiniz işletmeyi seçin.
      </p>

      <div className="mt-6 space-y-3">
        {organizations.map((organization) => (
          <button
            key={organization.org_id}
            type="button"
            onClick={() => void handleSelect(organization.org_id)}
            disabled={loadingOrgId !== null}
            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-background px-4 py-3 text-left transition hover:border-blue-500 hover:bg-blue-950/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>
              <span className="block font-medium">{organizationLabel(organization)}</span>
              <span className="block text-sm text-muted-foreground">
                {organization.client_name}
              </span>
            </span>
            <span className="text-sm text-blue-400">
              {loadingOrgId === organization.org_id ? "Seçiliyor..." : "Seç"}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </section>
  );
}
