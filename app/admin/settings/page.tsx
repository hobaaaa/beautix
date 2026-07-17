import { PublicSlugForm } from "./PublicSlugForm";
import { getOrganizationSettings } from "./queries";

export default async function AdminSettingsPage() {
  const settings = await getOrganizationSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ayarlar</h1>
        <p className="text-sm text-muted-foreground">
          İşletme profilinizi ve public randevu bağlantınızı yönetin.
        </p>
      </div>

      <section className="rounded-2xl border bg-card p-4 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">{settings.name}</h2>
          <p className="text-sm text-muted-foreground">
            Bu kartta yalnızca public randevu URL altyapısı yönetilir.
          </p>
        </div>

        <PublicSlugForm initialSlug={settings.public_slug} />
      </section>
    </div>
  );
}
