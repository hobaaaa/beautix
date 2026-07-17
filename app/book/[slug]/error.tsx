"use client";

export default function PublicBookingError() {
  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-2xl items-center justify-center">
        <section className="rounded-3xl border bg-card p-6 text-center shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold">Randevu bilgileri yüklenemedi</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Randevu bilgileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
          </p>
        </section>
      </div>
    </main>
  );
}
