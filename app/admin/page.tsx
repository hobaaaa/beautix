export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Yönetim Paneli</h1>
        <p className="text-sm text-gray-500">Günlük özet ve hızlı aksiyonlar.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Bugün</div>
          <div className="mt-2 text-3xl font-semibold">-</div>
          <div className="mt-1 text-xs text-gray-500">bugünkü randevu sayısı</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Yarın</div>
          <div className="mt-2 text-3xl font-semibold">-</div>
          <div className="mt-1 text-xs text-gray-500">yarın randevu sayısı</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Toplam</div>
          <div className="mt-2 text-3xl font-semibold">-</div>
          <div className="mt-1 text-xs text-gray-500">aktif randevu sayısı</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border p-4">
          <div className="font-medium">Bugünün randevuları</div>
          <div className="mt-3 text-sm text-gray-500">
            (Sprint 2 Kart 5&apos;te gerçek liste gelecek.)
          </div>
          <div className="mt-4 h-28 rounded-lg bg-muted/40" />
        </div>

        <div className="rounded-xl border p-4">
          <div className="font-medium">Yarın</div>
          <div className="mt-3 text-sm text-gray-500">
            (Hizmet ekle / Çalışma saatlerini ayarla / Randevu ekle)
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="h-10 rounded-lg bg-muted/40"></div>
            <div className="h-10 rounded-lg bg-muted/40"></div>
            <div className="h-10 rounded-lg bg-muted/40"></div>
            <div className="h-10 rounded-lg bg-muted/40"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
