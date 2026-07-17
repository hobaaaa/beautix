"use client";

export type ClientFormValues = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  birth_date: string;
};

export function ClientForm({
  loading,
  onCancel,
  onChange,
  onSubmit,
  submitLabel,
  values,
}: {
  loading: boolean;
  onCancel: () => void;
  onChange: (values: ClientFormValues) => void;
  onSubmit: () => void;
  submitLabel: string;
  values: ClientFormValues;
}) {
  function updateField(field: keyof ClientFormValues, value: string) {
    onChange({ ...values, [field]: value });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="client-first-name" className="text-sm font-medium">
            Ad <span className="text-red-400">*</span>
          </label>
          <input
            id="client-first-name"
            value={values.first_name}
            onChange={(event) => updateField("first_name", event.target.value)}
            disabled={loading}
            autoComplete="given-name"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="client-last-name" className="text-sm font-medium">
            Soyad <span className="text-red-400">*</span>
          </label>
          <input
            id="client-last-name"
            value={values.last_name}
            onChange={(event) => updateField("last_name", event.target.value)}
            disabled={loading}
            autoComplete="family-name"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="client-phone" className="text-sm font-medium">Telefon</label>
          <input
            id="client-phone"
            type="tel"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            disabled={loading}
            autoComplete="tel"
            placeholder="05xx xxx xx xx"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="client-email" className="text-sm font-medium">
            E-posta <span className="text-red-400">*</span>
          </label>
          <input
            id="client-email"
            type="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            disabled={loading}
            autoComplete="email"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="client-address" className="text-sm font-medium">Adres</label>
        <textarea
          id="client-address"
          value={values.address}
          onChange={(event) => updateField("address", event.target.value)}
          disabled={loading}
          autoComplete="street-address"
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="client-birth-date" className="text-sm font-medium">Doğum Tarihi</label>
          <input
            id="client-birth-date"
            type="date"
            value={values.birth_date}
            onChange={(event) => updateField("birth_date", event.target.value)}
            disabled={loading}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="client-notes" className="text-sm font-medium">Notlar</label>
        <textarea
          id="client-notes"
          value={values.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          disabled={loading}
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-50"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

