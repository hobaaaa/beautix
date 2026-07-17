import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicOrganizationBySlug } from "../queries";

type PublicBookingSuccessPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicBookingSuccessPage({
  params,
}: PublicBookingSuccessPageProps) {
  const { slug } = await params;
  const organization = await getPublicOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-2xl items-center justify-center">
        <section className="w-full rounded-3xl border bg-card p-6 text-center shadow-sm sm:p-8">
          <div className="mb-6 flex justify-center">
            <ArtexoBrand compact />
          </div>
          <p className="text-sm text-muted-foreground">{organization.name}</p>
          <h1 className="mt-2 text-3xl font-semibold">Randevunuz oluşturuldu</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Randevu bilgileriniz e-posta adresinize gönderilecektir.
          </p>
          <Link
            href={`/book/${encodeURIComponent(organization.public_slug)}`}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Yeni Randevu Al
          </Link>
        </section>
      </div>
    </main>
  );
}
