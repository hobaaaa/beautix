import { ArtexoBrand } from "@/components/brand/ArtexoBrand";
import { ArrowLeft, CalendarPlus, Clock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerLogoutButton } from "../CustomerLogoutButton";
import { CustomerAuthRequiredError, getCustomerServices } from "../queries";

function organizationLabel(orgId: string) {
  return `İşletme ${orgId.slice(0, 8)}`;
}

function formatPrice(price: string) {
  const numericPrice = Number(price);

  if (Number.isFinite(numericPrice)) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 2,
    }).format(numericPrice);
  }

  return price;
}

export default async function CustomerServicesPage() {
  let result;

  try {
    result = await getCustomerServices();
  } catch (error) {
    if (error instanceof CustomerAuthRequiredError) {
      redirect("/customer/login");
    }

    throw error;
  }

  const { context, services } = result;
  const { organizations, selectedOrganization } = context;

  if (organizations.length > 0 && !selectedOrganization) {
    redirect("/customer");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/customer"
              className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Müşteri paneline dön
            </Link>
            <ArtexoBrand compact />
            <h1 className="text-2xl font-semibold">Hizmetler</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedOrganization
                ? `${organizationLabel(selectedOrganization.org_id)} için aktif hizmetler.`
                : "Hizmetleri görüntülemek için bir işletme bağlantısı gerekir."}
            </p>
          </div>
          <CustomerLogoutButton />
        </header>

        {organizations.length === 0 ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              Bu hesap herhangi bir işletmeye bağlı değil.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Hizmetleri görüntülemek için işletme tarafından müşteri kaydınızın
              oluşturulması gerekir.
            </p>
          </section>
        ) : services.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center">
            <h2 className="text-xl font-semibold">Aktif hizmet bulunmuyor.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bu işletme için şu anda randevu alınabilecek aktif hizmet yok.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <article
                key={service.id}
                className="flex min-h-56 flex-col rounded-3xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{service.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {service.description ??
                        "Bu hizmet için detaylı açıklama henüz eklenmemiş."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-600/15 p-3 text-blue-400">
                    <CalendarPlus className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {service.duration_minutes} dk
                  </span>
                  {service.price && (
                    <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-muted-foreground">
                      {formatPrice(service.price)}
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-6">
                  <Link
                    href={`/customer/booking?serviceId=${service.id}`}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    Randevu Al
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
