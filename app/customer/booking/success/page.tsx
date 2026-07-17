import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function CustomerBookingSuccessPage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center">
        <section className="w-full rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="flex justify-center">
            <ArtexoBrand />
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Randevunuz oluşturuldu</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Randevu kaydınız başarıyla alındı. Müşteri paneline dönebilir veya
            yeni bir randevu oluşturabilirsiniz.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/customer"
              className="inline-flex items-center justify-center rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Müşteri Paneline Dön
            </Link>
            <Link
              href="/customer/services"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Yeni Randevu Al
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}


