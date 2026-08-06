# Artexo

Artexo, randevu ile çalışan işletmeler için geliştirilmiş çok kiracılı bir appointment management uygulamasıdır. Kuaför, berber, güzellik salonu, diş hekimi, poliklinik, psikolog, fizyoterapist, diyetisyen, veteriner ve benzeri işletmeler için admin paneli, müşteri portalı ve public booking akışı sağlar.

## Proje Hakkında

Uygulama tek kod tabanı üzerinden birden fazla işletmeyi `organization` bazında izole eder. Admin tarafı işletme operasyonlarını yönetir; customer tarafı mevcut müşterilerin kendi randevularını görüntülemesi ve yönetmesi içindir; public booking ise giriş gerektirmeden yeni randevu alınmasını sağlar.

UI iki dil destekleyecek şekilde ilerletilmektedir:

- Varsayılan dil: `tr`
- Desteklenen diller: `tr`, `en`
- Locale route örnekleri: `/tr`, `/en`, `/en/book/<slug>`

## Temel Özellikler

- Multi-tenant organization izolasyonu
- Admin auth ve ayrı customer auth
- Customer public signup kapalı
- Admin-created client provisioning
- Client, staff, service ve working hours yönetimi
- Slot engine ve availability hesaplama
- Customer booking ve appointment cancellation
- Appointment lifecycle: `confirmed`, `cancelled`, `completed`, `no_show`
- Public booking: hizmet, tarih, personel, slot, guest form, appointment create
- Public booking rate-limit, honeypot, minimum form süresi ve Turnstile doğrulaması
- PWA manifest, install yönlendirmesi ve mobil polish
- Resend email notification sistemi
- Booking confirmation, appointment reminder ve business booking notification
- Retry stratejisi ve notification logs
- Demo account ve demo data scriptleri

## Tech Stack

- Next.js 16 App Router
- TypeScript
- TailwindCSS
- Shadcn UI
- Supabase Auth ve PostgreSQL
- PostgreSQL RLS
- Resend
- Supabase Cron
- PWA

## Mimari Kurallar

- READ işlemleri: `queries.ts` + Server Component
- WRITE işlemleri: API Routes
- Server Actions kullanılmıyor
- Kod isimleri İngilizce
- Kullanıcıya görünen UI metinleri Türkçe/İngilizce locale yapısından gelir
- RLS aktif kalmalı
- Service role yalnızca server-side kullanılabilir
- Service role, secret env veya credential browser bundle’a gitmemeli
- Admin auth ve customer auth ayrımı korunmalı
- Customer kendi hesabını public signup ile oluşturamaz
- Multi-tenant izolasyonu temel güvenlik kuralıdır

## Proje Yapısı

```txt
app/admin                  Admin panel route ve componentleri
app/customer               Customer portal route ve componentleri
app/book                   Public booking route'ları
app/[locale]               Locale-aware route girişleri
app/api                    API route write/cron endpointleri
components                 Ortak UI ve PWA componentleri
lib                        Supabase, i18n, notification, slot ve helper kodları
supabase/migrations        Production'a manuel uygulanacak SQL migrationlar
scripts                    Demo account/data ve test yardımcı scriptleri
docs                       Deploy, güvenlik, performans ve entegrasyon dokümanları
```

## Kurulum

```bash
git clone <repo-url>
cd beautix-app
npm install
```

`.env.local` dosyasını oluştur:

```bash
cp .env.example .env.local
```

Migrationları Supabase tarafında uygula. Sonra development server:

```bash
npm run dev
```

Windows PowerShell için:

```powershell
npm.cmd run dev
```

## Environment Variables

Public env değerleri browser tarafına gidebilir:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

Secret env değerleri sadece server ortamında kullanılmalıdır:

```txt
SUPABASE_SECRET_KEY=
RESEND_API_KEY=
CRON_SECRET=
BOOKING_RATE_LIMIT_SECRET=
TURNSTILE_SECRET_KEY=
```

Demo script env değerleri:

```txt
ALLOW_DEMO_ACCOUNT_PROVISION=
ALLOW_DEMO_SEED=
DEMO_ORG_ID=
DEMO_ORG_NAME=
DEMO_PUBLIC_SLUG=
DEMO_LOCALE=tr
DEMO_ADMIN_EMAIL=
DEMO_ADMIN_PASSWORD=
DEMO_CUSTOMER_EMAIL=
DEMO_CUSTOMER_PASSWORD=
```

Gerçek secret, production URL, API key veya müşteri bilgisi dokümana yazılmamalıdır.

## Supabase Kurulumu ve Migrationlar

Migration dosyaları:

```txt
supabase/migrations
```

Production migrationları Supabase SQL Editor üzerinden dependency sırasına göre manuel uygulanır. Detaylı sıra ve production checklist için:

- [docs/PRODUCTION_DEPLOY_CHECKLIST.md](./docs/PRODUCTION_DEPLOY_CHECKLIST.md)

Notlar:

- RLS production tablolarında aktif olmalıdır.
- Notification sistemi için Supabase Cron ve HTTP request entegrasyonu gerekir.
- Production reset veya destructive seed önerilmez.

## Development

Mevcut scriptler:

```bash
npm run dev
npm run lint
npm run build
npm run demo:accounts
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
-> notification_jobs
-> Supabase Cron
-> POST /api/cron/notifications
-> Resend
-> notification_logs
```

Cron schedule:

```txt
*/5 * * * *
```

Desteklenen notification type değerleri:

- `booking_confirmation`
- `appointment_reminder`
- `business_booking_notification`

Kurallar:

- Reminder randevudan 24 saat önce planlanır.
- Maksimum toplam deneme sayısı 2’dir.
- `CRON_SECRET`, Vercel env ve Supabase Cron Authorization header değerinde aynı olmalıdır.
- `RESEND_API_KEY` Supabase’e değil, yalnızca Vercel/server env’e eklenir.
- Email dili job locale değerinden veya organization default locale değerinden belirlenir.

## Public Booking

Public URL formatı:

```txt
/book/[slug]
/en/book/[slug]
```

Public booking login gerektirmez. Aktif hizmetleri, tarih/personel seçimini, uygun slotları, guest bilgi formunu ve appointment create akışını destekler. Başarılı booking sonrasında confirmation, business notification ve şart uygunsa reminder job oluşturulur.

Spam koruması:

- IP ve contact değerleri açık saklanmaz; server-side HMAC hash ile tutulur.
- Aynı IP için 10 dakikada 5 deneme limiti vardır.
- Aynı IP + organization için 1 dakikada 2 deneme limiti vardır.
- Aynı normalize e-posta veya telefon için 30 dakikada en fazla 3 başarılı public booking oluşturulabilir.
- Guest formda honeypot ve minimum 2 saniyelik form süresi kontrolü vardır.
- Public booking submit aşamasında Cloudflare Turnstile server-side doğrulaması kullanılır.
- İşletme girişi, müşteri girişi ve şifremi unuttum akışları Turnstile ile korunur.

Web sitesi entegrasyonu ve manuel test:

- [docs/WEBSITE_INTEGRATION_GUIDE.md](./docs/WEBSITE_INTEGRATION_GUIDE.md)
- [docs/PUBLIC_BOOKING_E2E_CHECKLIST.md](./docs/PUBLIC_BOOKING_E2E_CHECKLIST.md)

## Demo Data

Demo seed otomatik çalışmaz. Ayrıntılar:

- [docs/DEMO_DATA_GUIDE.md](./docs/DEMO_DATA_GUIDE.md)
- [docs/DEMO_ACCOUNT_GUIDE.md](./docs/DEMO_ACCOUNT_GUIDE.md)

Dry-run örneği:

```powershell
$env:ALLOW_DEMO_SEED="true"
$env:DEMO_ORG_ID="<organization-uuid>"
$env:DEMO_LOCALE="tr"
npm.cmd run seed:demo -- --dry-run
```

İngilizce demo verisi için:

```powershell
$env:DEMO_LOCALE="en"
```

Gerçek production organization üzerinde çalıştırılmamalıdır. Script auth user oluşturmaz, invite/reset email göndermez ve notification job üretmez.

## Güvenlik

Kısa özet:

- RLS aktif kalır.
- Her tenant verisi `org_id` üzerinden izole edilir.
- API route’larda resource ownership server-side doğrulanır.
- Customer işlemleri dar kapsamlı RPC’lerle sınırlandırılır.
- Public booking rate-limit ve Turnstile ile korunur.
- Service role browser bundle’a gitmez.
- Secret env değerleri loglanmaz veya dokümana yazılmaz.

Security review çıktısı ayrı arşivlenmişse proje arşivinden kontrol edilmelidir.

## Production Deploy

Production deploy öncesi kontrol başlıkları:

- Vercel env değerleri
- Supabase migrations
- Supabase Auth URL config
- Supabase Cron
- Resend DNS ve sender doğrulaması
- Public booking smoke test
- PWA manifest ve install testi
- Domain ve mobile test

Ayrıntı için:

- [docs/PRODUCTION_DEPLOY_CHECKLIST.md](./docs/PRODUCTION_DEPLOY_CHECKLIST.md)

## Faydalı Dokümanlar

- [docs/PRODUCTION_DEPLOY_CHECKLIST.md](./docs/PRODUCTION_DEPLOY_CHECKLIST.md)
- [docs/DEMO_DATA_GUIDE.md](./docs/DEMO_DATA_GUIDE.md)
- [docs/DEMO_ACCOUNT_GUIDE.md](./docs/DEMO_ACCOUNT_GUIDE.md)
- [docs/WEBSITE_INTEGRATION_GUIDE.md](./docs/WEBSITE_INTEGRATION_GUIDE.md)
- [docs/PUBLIC_BOOKING_E2E_CHECKLIST.md](./docs/PUBLIC_BOOKING_E2E_CHECKLIST.md)

## Bilinen Sınırlar / V2 Roadmap

Henüz aktif özellik gibi sunulmaması gereken V2 başlıkları:

- Email doğrulama iyileştirmeleri
- İşletmeye özel tema/renk/logo özelleştirme
- Web Push / PWA notifications
- Google/Outlook Calendar integration
- Online payment / deposit
- Analytics/reporting
- Multi-location
- Automation
- AI assistant
- Widget, iframe embed ve custom domain booking
