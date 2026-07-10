import Link from "next/link";
import { getAdminDashboardData } from "./queries";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function getStatusLabel(status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show") {
  switch (status) {
    case "pending":
      return "Bekliyor";
    case "confirmed":
      return "Onaylandı";
    case "completed":
      return "Tamamlandı";
    case "cancelled":
      return "İptal Edildi";
    case "no_show":
      return "Gelmedi";
  }
}

export default async function AdminPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gösterge Paneli</h1>
          <p className="text-sm text-muted-foreground">
            Günlük randevu özetinizi ve hızlı erişimleri görüntüleyin.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/appointments"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white"
          >
            Yeni Randevu
          </Link>
          <Link href="/admin/services" className="rounded-md border px-3 py-2 text-sm">
            Hizmetler
          </Link>
          <Link href="/admin/staff" className="rounded-md border px-3 py-2 text-sm">
            Personeller
          </Link>
          <Link href="/admin/hours" className="rounded-md border px-3 py-2 text-sm">
            Çalışma Saatleri
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Bugün</div>
          <div className="mt-2 text-3xl font-semibold">{dashboard.todayCount}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Bugünkü iptal edilmeyen randevu sayısı
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Yarın</div>
          <div className="mt-2 text-3xl font-semibold">{dashboard.tomorrowCount}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Yarının iptal edilmeyen randevu sayısı
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Yaklaşan Randevular</div>
          <div className="mt-2 text-3xl font-semibold">{dashboard.upcomingCount}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Şu andan sonraki iptal edilmeyen toplam randevu sayısı
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border p-4">
          <div className="mb-4 font-medium">Bugünün Randevuları</div>
          {dashboard.todayAppointments.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Bugün için randevu bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-[72px_1fr]"
                >
                  <div className="font-medium">{formatTime(appointment.start_at)}</div>
                  <div className="space-y-1">
                    <div className="font-medium">{appointment.client_name}</div>
                    <div className="text-muted-foreground">
                      {appointment.service_name} • {appointment.staff_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getStatusLabel(appointment.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border p-4">
          <div className="mb-4 font-medium">Yarının Randevuları</div>
          {dashboard.tomorrowAppointments.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Yarın için randevu bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.tomorrowAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-[72px_1fr]"
                >
                  <div className="font-medium">{formatTime(appointment.start_at)}</div>
                  <div className="space-y-1">
                    <div className="font-medium">{appointment.client_name}</div>
                    <div className="text-muted-foreground">
                      {appointment.service_name} • {appointment.staff_name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
