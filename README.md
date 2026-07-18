# Artexo

Artexo, randevu ile çalışan işletmeler için geliştirilen çok kiracılı bir yönetim ve müşteri randevu platformudur. Admin paneli işletme operasyonlarını yönetir; müşteri paneli hizmet seçimi, müsait saat görüntüleme, randevu oluşturma ve randevu takibi akışlarını sağlar.

Hedef kullanım alanları: kuaför, berber, güzellik salonu, diş hekimi, poliklinik, psikolog, fizyoterapist, diyetisyen, veteriner ve randevu ile çalışan diğer işletmeler.

## Proje Hakkında

Artexo'nun temel modeli organization bazlıdır. Her müşteri, hizmet, personel, çalışma saati ve randevu bir organization altında izole edilir. Randevu mimarisi staff bazlıdır; her appointment mutlaka bir personele bağlıdır.

## Temel Özellikler

- Multi-tenant organization izolasyonu
- Admin auth ve ayrı customer auth
- Customer public signup kapalı; customer hesabı admin-created client provisioning ile aktive edilir
- Client management
- Staff management ve staff-service mapping
- Service management
- Working hours yönetimi
- Slot engine ve availability engine
- Customer booking akışı
- Public booking URL, aktif hizmet, tarih, personel, slot seçimi, guest bilgi formu ve appointment create altyapısı: `/book/[slug]`
- Appointment cancellation
- Appointment lifecycle: `confirmed`, `cancelled`, `completed`, `no_show`
- PWA kurulum deneyimi
- Email notification sistemi
- 24 saat öncesi appointment reminder
- Business booking notification
- Retry ve notification logs

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- TailwindCSS 4
- Shadcn UI yaklaşımıyla yerel UI bileşenleri
- Supabase Auth, PostgreSQL ve RLS
- Resend
- Supabase Cron
- PWA manifest ve service worker

## Mimari Kurallar

- READ işlemleri: `queries.ts` + Server Component
- WRITE işlemleri: API Routes
- Server Actions kullanılmaz
- Kod, route, type ve database isimleri İngilizce kalır
- Kullanıcıya görünen UI metinleri Türkçedir
- RLS aktiftir
- Service role yalnızca server-side kodda kullanılabilir
- Admin Auth ve Customer Auth ayrı akışlardır
- Multi-tenant izolasyonu temel güvenlik kuralıdır

## Proje Yapısı

```txt
app/admin                 Admin panel sayfaları
app/customer              Customer panel sayfaları
app/api                   Admin, customer ve cron API route'ları
components                Ortak UI, brand ve PWA bileşenleri
lib                       Supabase, slots, notifications ve yardımcı katmanlar
supabase/migrations       Manuel uygulanan DB migration dosyaları
scripts                   Manuel çalıştırılan yardımcı scriptler
```

## Kurulum

```bash
git clone <repo-url>
cd <repo-klasoru>
npm install
```

Environment dosyasını oluştur:

```bash
cp .env.example .env.local
```

Supabase migrationlarını uygula, ardından geliştirme sunucusunu başlat:

```bash
npm run dev
```

Lokal adres:

```txt
http://localhost:3000
```

## Environment Variables

`.env.example` yalnızca placeholder değerler içerir. Gerçek secret veya credential commit edilmemelidir.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
RESEND_API_KEY=
CRON_SECRET=
BOOKING_RATE_LIMIT_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Ayrım:

- `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` public client kullanımı içindir.
- `SUPABASE_SECRET_KEY`, `RESEND_API_KEY` ve `CRON_SECRET` server-side kalmalıdır.
- `BOOKING_RATE_LIMIT_SECRET` public booking HMAC hashleri için server-side kalmalıdır.
- `NEXT_PUBLIC_SITE_URL`, invite/reset linkleri için public site URL değeridir.
- `VERCEL_URL` ve `NODE_ENV` platform tarafından sağlanabilir.
- `.env.local` commit edilmez.

## Supabase Kurulumu ve Migrationlar

Migration dosyaları:

```txt
supabase/migrations
```

Bu projede production migrationları Supabase SQL Editor üzerinden dependency sırasına göre manuel uygulanmaktadır. Sıra ve dependency detayları için:

- [docs/PRODUCTION_DEPLOY_CHECKLIST.md](./docs/PRODUCTION_DEPLOY_CHECKLIST.md)

Notlar:

- RLS production tablolarında aktif olmalıdır.
- Notification sistemi için Supabase Cron tarafında `pg_cron` ve HTTP request entegrasyonu gerekir.
- Production reset veya destructive seed önerilmez.

## Development

Mevcut scriptler:

```bash
npm run dev
npm run lint
npm run build
npm run seed:demo
npm run test:booking
npm run test:booking:race
```

Booking ve slot testleri:

```bash
npm run test:booking
```

## Production Build

```bash
npm run lint
npm run build
```

Build sırasında email gönderimi, seed veya cron çalışmaz.

## Notification Sistemi

Akış:

```txt
appointment create
→ notification_jobs
→ Supabase Cron
→ POST /api/cron/notifications
→ Resend
→ notification_logs
```

Cron:

```txt
*/5 * * * *
```

Desteklenen notification type değerleri:

- `booking_confirmation`
- `appointment_reminder`
- `business_booking_notification`

Kurallar:

- Reminder randevudan 24 saat önce planlanır.
- Maksimum toplam deneme sayısı 2'dir.
- `CRON_SECRET`, Vercel env ve Supabase Cron Authorization header değerinde aynı olmalıdır.
- `RESEND_API_KEY` Supabase'e değil, yalnızca Vercel/server env'e eklenir.

## Public Booking URL Altyapısı

İşletmeler için global unique public slug, aktif hizmet seçimi, tarih seçimi, personel seçimi, uygun slot seçimi, guest bilgi formu ve public appointment create altyapısı hazırlanmıştır. Public URL formatı:

```txt
/book/[slug]
```

Bu route şu anda işletme adını, online randevuya açık aktif hizmetleri, tarih/personel seçimini, uygun slotları, confirm ekranında guest bilgi formunu ve public appointment create akışını destekler. Başarılı booking sonrasında confirmation, business notification ve şart uygunsa reminder job oluşturulur.

Public booking MVP spam koruması:

- IP ve contact değerleri açık saklanmaz; server-side HMAC hash ile tutulur.
- Aynı IP için 10 dakikada 5 deneme, aynı IP + organization için 1 dakikada 2 deneme limiti vardır.
- Aynı normalize e-posta veya telefon için 30 dakikada en fazla 3 başarılı public booking oluşturulabilir.
- Guest formda honeypot ve minimum 2 saniyelik form süresi kontrolü vardır.
- CAPTCHA / reCAPTCHA / Turnstile henüz kullanılmıyor; bot trafiği artarsa V2 kapsamında değerlendirilecektir.

## Demo Data

Demo seed otomatik çalışmaz. Ayrıntılar:

- [docs/DEMO_DATA_GUIDE.md](./docs/DEMO_DATA_GUIDE.md)

Dry-run örneği:

```powershell
$env:ALLOW_DEMO_SEED="true"
$env:DEMO_ORG_ID="<organization-uuid>"
npm run seed:demo -- --dry-run
```

Gerçek production organization üzerinde çalıştırılmamalıdır. Script auth user oluşturmaz, invite/reset email göndermez ve notification job üretmez.

## Güvenlik

Kısa özet:

- RLS aktif kalır
- Her tenant verisi `org_id` üzerinden izole edilir
- API route'larda resource ownership server-side doğrulanır
- Customer işlemleri dar kapsamlı RPC'lerle sınırlandırılır
- Service role browser bundle'a gitmez
- Secret env değerleri loglanmaz veya dokümana yazılmaz

Security review çıktısı önceki sprintte hazırlanmıştır. Doküman arşivlenmişse ilgili kayıt proje arşivinden geri alınmalıdır.

## Production Deploy

Production deploy öncesi kontrol başlıkları:

- Vercel env değerleri
- Supabase migrations
- Supabase Auth Site URL / Redirect URLs
- Supabase Cron job
- Resend DNS: SPF, DKIM, DMARC
- Domain, manifest, service worker ve PWA testleri

Ayrıntılı checklist:

- [docs/PRODUCTION_DEPLOY_CHECKLIST.md](./docs/PRODUCTION_DEPLOY_CHECKLIST.md)

## Faydalı Dokümanlar

- [docs/PRODUCTION_DEPLOY_CHECKLIST.md](./docs/PRODUCTION_DEPLOY_CHECKLIST.md)
- [docs/DEMO_DATA_GUIDE.md](./docs/DEMO_DATA_GUIDE.md)

## Bilinen Sınırlar / V2 Roadmap

Henüz kapsamda olmayan başlıklar:

- Web Push / PWA notifications
- Google Calendar ve Outlook Calendar entegrasyonu
- Online payment / deposit
- Gelişmiş analytics ve reporting
- Multi-location organization yapısı
- Gelişmiş automation kuralları
- AI assistant

Bu başlıklar mevcut özellik gibi değerlendirilmemelidir.
