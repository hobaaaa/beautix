# Artexo Production Deploy Checklist

Bu dokuman production deploy oncesi son kontrol listesidir. Gercek secret degerleri bu dosyaya yazilmamalidir.

## Vercel

- Production build komutu: `npm.cmd run build`
- Runtime: Varsayilan Next.js Node/server runtime korunmali. Supabase, Resend ve cron route'lari Edge Runtime'a tasinmamalidir.
- GitHub entegrasyonu ve deploy komutu mevcut haliyle korunmali.
- Vercel dashboard'da Production environment icin gerekli env degerlerinin tanimli oldugu kontrol edilmeli.
- Preview ve Production env degerleri ayrilmali; production secret'lari yalnizca Production ortaminda kullanilmalidir.
- Vercel region koddan kesin dogrulanamadi. Supabase region'a yakin bir Vercel region secildigi dashboard'dan manuel kontrol edilmelidir.

## Environment Variables

Kodda kullanilan env isimleri:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY`
- `RESEND_API_KEY`
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `VERCEL_URL`
- `NODE_ENV`

Kontrol:

- `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` public client kullanimi icindir.
- `SUPABASE_SECRET_KEY`, `RESEND_API_KEY` ve `CRON_SECRET` server-side kalmalidir.
- `NEXT_PUBLIC_SITE_URL` production domain olmalidir. Yoksa invite reset linkleri Vercel'in `VERCEL_URL` degerine duser.
- `.env*` dosyalari `.gitignore` icinde ignore ediliyor.
- Repo taramasinda gercek secret degeri commitlenmis tracked env dosyasi bulunmadi. `README.md` yalnizca placeholder env isimleri iceriyor.
- Vercel dashboard'da bu env'lerin Development yerine Production ortaminda da tanimli oldugu manuel kontrol edilmelidir.

## Supabase Migrations

Production'a migrationlar dependency sirasina gore uygulanmalidir. Uygulanip uygulanmadigi koddan varsayilmamalidir.

Sira:

1. `20260626_admin_performance_indexes.sql`
2. `20260626_staff_appointments_architecture.sql`
3. `20260626_staff_appointment_types_delete_policy.sql`
4. `20260710_staff_delete_policy.sql`
5. `20260711_clients_management.sql`
6. `20260711_customer_auth_identity.sql`
7. `20260713_appointment_lifecycle_statuses.sql`
8. `20260713_organization_profiles.sql`
9. `20260713_customer_booking_availability.sql`
10. `20260713_customer_cancel_appointment.sql`
11. `20260713_notification_jobs.sql`
12. `20260713_business_booking_notification.sql`
13. `20260713_notification_job_claiming.sql`
14. `20260713_notification_reminder_jobs.sql`
15. `20260713_notification_logs.sql`
16. `20260717_notification_logs_admin_select_policy.sql`
17. `20260717_performance_indexes_and_busy_slots.sql`

Production'da bulunmasi gereken kritik nesneler:

- `appointment_status` enum degerleri: `confirmed`, `cancelled`, `completed`, `no_show`
- Staff bazli appointment overlap constraint
- `get_customer_staff_busy_appointments`
- `cancel_customer_appointment`
- `notification_jobs`
- `claim_due_notification_jobs`
- `enqueue_booking_confirmation_notification_job`
- `enqueue_appointment_reminder_notification_job`
- `enqueue_business_booking_notification_job`
- `notification_logs`
- `notification_logs_org_members_select` policy
- Performance indexleri ve busy slots RPC guncellemesi

RLS kontrol:

- RLS production tablolarinda aktif olmalidir.
- Customer'a `notification_jobs` veya `notification_logs` genel read/write yetkisi acilmamalidir.
- Production DB'ye destructive reset veya seed uygulanmamalidir.
- Demo data seed otomatik uygulanmaz. Gerekirse yalnizca kontrollu demo organization uzerinde `DEMO_DATA_GUIDE.md` adimlariyla manuel calistirilir.

## Supabase Auth

Supabase Auth URL Configuration manuel kontrol edilmeli:

- Site URL production domain olmali.
- Redirect URL listesinde production domain icin gerekli path'ler olmali:
  - `/auth/callback`
  - `/reset-password`
  - `/login`
  - `/customer/login`
- Localhost redirect'leri development icin kalabilir ama production akislarini engellememelidir.
- Customer public signup acilmamali.
- Admin/customer auth ayrimi korunmali.

Kod kontrolu:

- `auth/callback` artik protocol-relative veya backslash iceren `next` degerlerini kabul etmiyor.
- Forgot/reset password donus path'i yalnizca `/login` veya `/customer/login` olarak normalize ediliyor.

## Supabase Cron

Cron gereksinimleri:

- Supabase tarafinda `pg_cron` ve HTTP request icin gerekli extension/entegrasyonlar aktif olmalidir.
- Cron job aktif olmali.
- Schedule: `*/5 * * * *`
- Method: `POST`
- URL: `https://<production-domain>/api/cron/notifications`
- Header: `Authorization: Bearer <CRON_SECRET>`
- Supabase Cron icin Resend API key gerekmez.
- Supabase tarafinda `CRON_SECRET` yalnizca request header icin kullanilmalidir.

Cron endpoint testi:

```bash
curl -i -X POST https://<production-domain>/api/cron/notifications
```

Beklenen: `401`

```bash
curl -i -X POST https://<production-domain>/api/cron/notifications \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Uyari: Dogru secret ile test pending job'lari gercekten isleyebilir. Production'da kontrollu test appointment/job kullanin.

## Resend/DNS

- Gonderen: `Artexo <artexo@denizgokbudak.com>`
- `RESEND_API_KEY` yalnizca server-side env olarak tanimli olmali.
- Worker desteklenen bildirim tiplerini isliyor:
  - `booking_confirmation`
  - `appointment_reminder`
  - `business_booking_notification`
- Email gonderimi build sirasinda tetiklenmez; yalnizca cron worker icinde calisir.

Manuel DNS kontrol:

- Resend domain verification tamam mi?
- SPF kaydi dogru mu?
- DKIM kaydi dogru mu?
- DMARC kaydi var mi ve hata uretmiyor mu?

## Domain/PWA

- Manifest `start_url` ve `scope`: `/`
- HTTPS production PWA icin zorunludur.
- Production domain uzerinde manuel kontrol:
  - `/manifest.webmanifest`
  - `/sw.js`
  - `/icons/icon-192x192.png`
  - `/icons/icon-512x512.png`
  - iOS Safari install yonlendirmesi
  - iOS Chrome manuel install yonlendirmesi
  - Standalone launch

## Smoke Tests

Production test verileri gercek musteri kayitlarini etkilememelidir. Test sonunda demo musteri/personel/hizmet kayitlari pasife alinmalidir; appointment delete is kurallari zorlanmamalidir.

| Test | Beklenen Sonuc |
| --- | --- |
| Root sayfa | Oturum yoksa giris turu secimi gorunur. |
| Admin login | Basarili giris `/admin` paneline yonlendirir. |
| Customer login | Basarili giris `/customer` paneline yonlendirir. |
| Logout | Ilgili kullanici oturumu kapanir ve giris ekranina doner. |
| Admin organization context | Admin yalnizca kendi organizasyon verilerini gorur. |
| Client olusturma | Yeni aktif musteri kendi organizasyonunda olusur. |
| Customer daveti | Davet/reset emaili gonderilir, ham hata UI'da gorunmez. |
| Password setup | Customer sifresini belirler ve `/customer/login` ile girer. |
| Service/staff secimi | Yalnizca aktif hizmet/personel secilebilir. |
| Customer booking | Tarih, personel, slot ve confirm akisi calisir. |
| Slot availability | Dolu slotlar ve gecmis saatler gorunmez. |
| Appointment confirmation | Appointment `confirmed` olusur. |
| Customer appointments | Customer sadece kendi randevularini gorur. |
| Customer cancel | Gelecek confirmed randevu iptal edilebilir. |
| Admin lifecycle | Gecmis confirmed randevu `completed` veya `no_show` yapilabilir. |
| Booking confirmation email | Customer'a randevu onay emaili gider. |
| Business notification email | Isletme emailine yeni randevu bildirimi gider. |
| Reminder job | 24 saatten uzak randevu icin reminder job olusur. |
| Cron claim/send | Cron pending job'lari isler, response hassas veri dondurmez. |
| Notification logs | Admin bildirim loglari kendi organizasyonunda gorunur. |
| Mobil PWA | Manifest, service worker ve standalone acilis calisir. |

## Rollback Notes

- Destructive SQL veya production reset onerilmez.
- Sorunlu deploy icin once Vercel'de onceki basarili deployment'a rollback yapin.
- Migration uygulanmis ve geri alinmasi gerekiyorsa, once veri etkisini degerlendirin; tablo/kolon silme gibi destructive adimlari dogrudan uygulamayin.
- Cron sorununda cron job gecici olarak disable edilebilir; mevcut job kayitlari silinmemelidir.
