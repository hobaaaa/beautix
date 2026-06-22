import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <main className="w-full max-w-2xl rounded-2xl border bg-card p-10 text-card-foreground shadow-sm">
        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">
            Beautix
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">
            İşletmenizi tek panelden yönetin.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Hizmetlerinizi, çalışma saatlerinizi ve randevularınızı yönetmek
            için yönetim paneline giriş yapın.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            Giriş Yap
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border px-5 py-3 text-sm font-medium"
          >
            Yönetim Paneline Git
          </Link>
        </div>
      </main>
    </div>
  );
}
