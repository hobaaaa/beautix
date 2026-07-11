import { CalendarDays } from "lucide-react";
import { redirect } from "next/navigation";
import { CustomerLogoutButton } from "./CustomerLogoutButton";
import { CustomerOrganizationSelector } from "./CustomerOrganizationSelector";
import {
  CustomerAuthRequiredError,
  getCustomerDashboardContext,
} from "./queries";

function organizationLabel(orgId: string) {
  return `İşletme ${orgId.slice(0, 8)}`;
}

export default async function CustomerHomePage() {
  let context;

  try {
    context = await getCustomerDashboardContext();
  } catch (error) {
    if (error instanceof CustomerAuthRequiredError) {
      redirect("/customer/login");
    }

    throw error;
  }

  const { organizations, selectedOrganization } = context;

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-blue-400">Artexo</div>
            <h1 className="text-xl font-semibold">Müşteri Paneli</h1>
          </div>
          <CustomerLogoutButton />
        </header>

        {organizations.length === 0 ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              Bu hesap herhangi bir işletmeye bağlı değil.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Devam etmek için işletme tarafından müşteri kaydınızın oluşturulması gerekir.
            </p>
          </section>
        ) : selectedOrganization ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div className="text-sm font-medium text-blue-400">
              {organizationLabel(selectedOrganization.org_id)}
            </div>
            <h2 className="mt-2 text-2xl font-semibold">
              Hoş geldiniz, {selectedOrganization.client_name}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Müşteri hesabınıza güvenli şekilde giriş yaptınız. Randevu işlemleri sonraki
              kartta eklenecek.
            </p>
          </section>
        ) : (
          <CustomerOrganizationSelector organizations={organizations} />
        )}
      </div>
    </main>
  );
}
