# Artexo

Artexo, randevu bazlı işletmeler için geliştirilen çok kiracılı bir yönetim ve müşteri randevu platformudur. Admin paneli işletme operasyonlarını yönetir; müşteri paneli ise hizmet seçimi, müsait slot görüntüleme, randevu oluşturma ve randevu takibi akışlarını sağlar.

Proje kuaför, güzellik salonu, berber, diş hekimi, fizyoterapi, psikolog, veteriner ve benzeri randevu bazlı işletmeler için genel bir SaaS mimarisi hedefler.

## Özellikler

- Admin paneli: hizmetler, personeller, müşteriler, çalışma saatleri, randevular ve bildirim logları.
- Müşteri paneli: hizmet listesi, tarih/personel/saat seçimi, randevu onayı, randevularım ve randevu iptali.
- Staff bazlı randevu mimarisi: her randevu bir personele bağlıdır.
- Slot ve availability engine: çalışma saatleri, hizmet süresi ve mevcut randevulara göre müsait saat üretimi.
- Appointment lifecycle: `confirmed`, `cancelled`, `completed`, `no_show`.
- PWA desteği: mobil kurulum yönlendirmeleri ve standalone açılış.
- E-posta bildirimleri: müşteri onayı, müşteri hatırlatma ve işletmeye yeni randevu bildirimi.
- Supabase RLS ve organization izolasyonu.

## Teknoloji

- Next.js 16 App Router
- React 19
- TypeScript
- TailwindCSS 4
- Supabase Auth, PostgreSQL, RLS
- Supabase Cron
- Resend
- PWA manifest + service worker

## Mimari Kurallar

Projede şu ayrım korunur:

- READ işlemleri: Server Component + `queries.ts`
- WRITE işlemleri: API Routes
- Server Actions kullanılmaz.
- Kod, route, type ve database isimleri İngilizce kalır.
- Kullanıcıya görünen metinler Türkçedir.
- Service role sadece server-side API/cron tarafında kullanılır.
- Multi-tenant güvenlik her sorguda `org_id` ve RLS ile korunur.

## Kurulum

```bash
npm install
npm.cmd run dev
```

Lokal uygulama:

```txt
http://localhost:3000
```

## Environment Variables

`.env.local` örneği:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=
RESEND_API_KEY=
CRON_SECRET=
```

Açıklamalar:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase proje URL’i.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase publishable/anon key.
- `SUPABASE_SECRET_KEY`: Supabase server-side secret/service key. Client bundle’a gitmemelidir.
- `NEXT_PUBLIC_SITE_URL`: Password reset ve davet linkleri için public site URL’i.
- `RESEND_API_KEY`: E-posta gönderimi için Resend API key.
- `CRON_SECRET`: Supabase Cron’un `/api/cron/notifications` endpoint’ini güvenli çağırması için kullanılan özel secret.

## Supabase

Migration dosyaları:

```txt
supabase/migrations
```

Önemli tablolar:

- `clients`
- `appointment_types`
- `staff`
- `staff_appointment_types`
- `appointments`
- `working_hours`
- `organization_profiles`
- `notification_jobs`
- `notification_logs`

Migration’lar production Supabase üzerinde uygulanmadan ilgili özellikler çalışmaz.

## Organization Profile

İşletme adının müşteri ekranlarında ve e-postalarda düzgün görünmesi için `organization_profiles` tablosunda kayıt olmalıdır.

Örnek:

```sql
insert into public.organization_profiles (org_id, name)
values ('ORG_UUID', 'İşletme Adı')
on conflict (org_id)
do update set name = excluded.name, updated_at = now();
```

Kayıt yoksa sistem fallback olarak `İşletme <uuid>` gösterir.

## Supabase Cron

Bildirim worker endpoint’i:

```txt
POST /api/cron/notifications
```

Önerilen cron schedule:

```txt
*/5 * * * *
```

Header:

```txt
Authorization: Bearer <CRON_SECRET>
```

Örnek endpoint:

```txt
https://app.artexo.app/api/cron/notifications
```

Cron endpoint şu işleri yapar:

- `pending` notification job’larını atomik şekilde claim eder.
- Booking confirmation e-postası gönderir.
- Appointment reminder e-postası gönderir.
- İşletmeye yeni randevu bildirimi gönderir.
- Her denemeyi `notification_logs` içine yazar.
- Retry edilebilir hatalarda job’u tekrar kuyruğa alır.

## E-posta Bildirimleri

Mevcut bildirim tipleri:

- `booking_confirmation`: müşteriye randevu onayı.
- `appointment_reminder`: müşteriye randevu hatırlatma.
- `business_booking_notification`: işletmeye yeni randevu bildirimi.

İşletme bildirimi için mevcut kural:

- İlgili `org_id` için `org_members -> auth.users.email` üzerinden tek net işletme alıcısı bulunmalıdır.
- Birden fazla org member varsa sistem rastgele seçim yapmaz ve bildirimi skipped/failed olarak kapatır.

## Scriptler

```bash
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
npm.cmd run start
npm.cmd run test:booking
npm.cmd run test:booking:race
```

## Test

Slot, availability ve booking validation testleri:

```bash
npm.cmd run test:booking
```

Booking race condition kontrolü:

```bash
npm.cmd run test:booking:race
```

## Build

```bash
npm.cmd run lint
npm.cmd run build
```

## Deployment Notları

Vercel production ortamında şu env değişkenleri tanımlı olmalıdır:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY`
- `CRON_SECRET`

Env değişikliği sonrası Vercel redeploy gerekir.

Supabase tarafında:

- Migration’lar uygulanmalı.
- Cron job tanımlanmalı.
- RLS policy’leri korunmalı.

## Sorun Giderme

Notification job oluşuyor ama mail gitmiyorsa:

```sql
select
  type,
  status,
  attempt_count,
  scheduled_for,
  processed_at,
  last_error,
  created_at
from public.notification_jobs
order by created_at desc
limit 20;
```

Logları görmek için:

```sql
select
  type,
  status,
  recipient,
  provider_message_id,
  error_message,
  created_at
from public.notification_logs
order by created_at desc
limit 20;
```

`pending` job’lar birikiyorsa cron endpoint çalışmıyordur. Vercel logs içinde şu route aranmalıdır:

```txt
/api/cron/notifications
```

## Lisans

Bu proje özel geliştirme kapsamındadır.
