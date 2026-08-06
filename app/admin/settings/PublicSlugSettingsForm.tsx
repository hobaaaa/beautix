"use client";

import type { AdminMessages } from "@/lib/i18n/admin";
import { normalizePublicSlug } from "@/lib/organizations/slug";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type PublicSlugSettingsFormProps = {
  initialSlug: string;
  messages: Pick<
    AdminMessages["settings"],
    | "slugLabel"
    | "slugHelp"
    | "preview"
    | "save"
    | "saving"
    | "updateSuccess"
    | "updateFailed"
  >;
};

export function PublicSlugSettingsForm({
  initialSlug,
  messages,
}: PublicSlugSettingsFormProps) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialSlug);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/organization/public-slug", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_slug: slug,
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        data?: {
          public_slug?: string;
        };
      };

      if (!response.ok || !payload.success) {
        setError(payload.error ?? messages.updateFailed);
        return;
      }

      const nextSlug = payload.data?.public_slug ?? normalizePublicSlug(slug);
      setSlug(nextSlug);
      setMessage(messages.updateSuccess);
      router.refresh();
    } catch {
      setError(messages.updateFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  const normalizedPreview = normalizePublicSlug(slug);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="public_slug" className="text-sm font-medium">
          {messages.slugLabel}
        </label>
        <div className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-3 sm:flex-row sm:items-center">
          <span className="shrink-0 text-sm text-muted-foreground">/book/</span>
          <input
            id="public_slug"
            value={slug}
            onChange={(event) => setSlug(normalizePublicSlug(event.target.value))}
            className="min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="isletme-adi"
            autoComplete="off"
          />
        </div>
        <p className="text-sm text-muted-foreground">{messages.slugHelp}</p>
        <p className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-100">
          {messages.preview}:{" "}
          <span className="font-medium">/book/{normalizedPreview || "isletme-adi"}</span>
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? messages.saving : messages.save}
      </button>
    </form>
  );
}
