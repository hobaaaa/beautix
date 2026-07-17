import { PageLoading } from "@/components/ui/page-loading";

export default function CustomerAppointmentsLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <PageLoading variant="cards" rows={4} />
      </div>
    </main>
  );
}
