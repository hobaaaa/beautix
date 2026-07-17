import { PageLoading } from "@/components/ui/page-loading";

export default function PublicBookingLoading() {
  return (
    <main className="min-h-dvh bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <PageLoading variant="cards" rows={1} />
      </div>
    </main>
  );
}
