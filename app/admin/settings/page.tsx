import { getAdminMessages } from "@/lib/i18n/admin";
import { defaultLocale, type Locale } from "@/lib/i18n/constants";
import { PublicSlugSettingsForm } from "./PublicSlugSettingsForm";
import { getOrganizationSettings } from "./queries";

type AdminSettingsPageContentProps = {
  locale?: Locale;
};

export async function AdminSettingsPageContent({
  locale = defaultLocale,
}: AdminSettingsPageContentProps = {}) {
  const messages = getAdminMessages(locale);
  const settings = await getOrganizationSettings(locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{messages.settings.title}</h1>
        <p className="text-sm text-muted-foreground">
          {messages.settings.description}
        </p>
        <p className="hidden">
          İşletme profilinizi ve public randevu bağlantınızı yönetin.
        </p>
      </div>

      <section className="rounded-2xl border bg-card p-4 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">{settings.name}</h2>
          <p className="text-sm text-muted-foreground">
            {messages.settings.publicBookingOnly}
          </p>
          <p className="hidden">
            Bu kartta yalnızca public randevu URL altyapısı yönetilir.
          </p>
        </div>

        <PublicSlugSettingsForm
          initialSlug={settings.public_slug}
          messages={messages.settings}
        />
      </section>
    </div>
  );
}

export default async function AdminSettingsPage() {
  return <AdminSettingsPageContent />;
}
