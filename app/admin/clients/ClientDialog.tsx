"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ClientForm, type ClientFormValues } from "./ClientForm";

export function ClientDialog({
  isOpen,
  loading,
  onChange,
  onClose,
  onSubmit,
  title,
  values,
}: {
  isOpen: boolean;
  loading: boolean;
  onChange: (values: ClientFormValues) => void;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  values: ClientFormValues;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={loading ? undefined : onClose}
        className="absolute inset-0 bg-black/80"
        aria-label="Müşteri formunu kapat"
      />
      <section className="dark-scrollbar relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#1f1f1f] p-5 text-zinc-100 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-sm text-zinc-400">Müşteri bilgilerini eksiksiz girin.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ClientForm
          loading={loading}
          onCancel={onClose}
          onChange={onChange}
          onSubmit={onSubmit}
          submitLabel={title === "Yeni Müşteri" ? "Müşteri Ekle" : "Değişiklikleri Kaydet"}
          values={values}
        />
      </section>
    </div>,
    document.body,
  );
}
