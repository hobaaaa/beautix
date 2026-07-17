# Artexo Security Review - Sprint 6 Kart 4

Tarih: 2026-07-17

## Kapsam

- Admin API route'lari
- Customer API route'lari
- Cron notification worker
- Supabase RLS policy'leri
- Security definer RPC'ler
- Appointment create, update, cancel ve lifecycle akislari
- Notification jobs ve logs izolasyonu

## Sonuc

Kritik cross-tenant veri erisimi veya client body/route parametresine tek basina guvenen appointment akisi tespit edilmedi.

Bulunan ve duzeltilen eksik:

- `notification_logs` tablosunda RLS aktifti, ancak admin bildirim loglari ekrani normal Supabase session client ile okuma yaptigi halde org-member SELECT policy yoktu. Customer veya anon'a erisim acmadan, sadece ayni organizasyon uyesi adminin kendi loglarini okuyabilecegi policy eklendi.

Eklenen migration:

- `supabase/migrations/20260717_notification_logs_admin_select_policy.sql`

## Kontrol Matrisi

| Alan | Durum |
| --- | --- |
| Admin org izolasyonu | `getCurrentOrgContext()` ve `org_id` filtreleriyle korunuyor. |
| Customer org izolasyonu | Customer organization cookie tek basina kullanilmiyor; `link_customer_clients()` ile session kullanicisi tekrar dogrulaniyor. |
| Appointment create | `org_id`, `client_id`, `start_at`, `end_at`, `status` server-side belirleniyor veya tekrar dogrulaniyor. |
| Appointment overlap | DB seviyesinde staff bazli exclusion constraint mevcut; cancelled kayitlar constraint disinda. |
| Customer cancel | Dar kapsamli `cancel_customer_appointment` RPC ile sadece kendi confirmed ve gelecekteki randevusunu iptal edebiliyor. |
| Admin lifecycle | Sadece ayni org, confirmed ve gecmis randevu `completed` veya `no_show` yapilabiliyor. |
| Service role | Sadece admin invite ve cron notification gibi server-side route'larda kullaniliyor. |
| Cron auth | `CRON_SECRET` dogrulanmadan service-role client olusturulmuyor. |
| Notification jobs | RLS aktif, genel read/write policy yok; claim RPC sadece service_role'a acik. |
| Notification logs | RLS aktif; yeni policy ile yalnizca org member admin SELECT yapabilir. |

## Manuel Test Checklist

- Admin A, Admin B organizasyonuna ait client/service/staff/appointment kaydini route parametresiyle guncelleyememeli.
- Customer A, baska customer'a ait appointment id ile cancel endpoint'inden 409/500 disinda basarili sonuc alamamali.
- Customer A, baska org id cookie veya select request'i ile o organizasyonu secememeli.
- Customer booking request body icine farkli `clientId`, `orgId`, `status`, `endAt` alanlari eklense bile etkisiz olmali.
- Ayni staff ve ayni saat icin iki confirmed appointment race durumunda DB constraint ikinci kaydi engellemeli.
- Cancelled appointment ayni staff/saat icin tekrar booking'e engel olmamali.
- Cron endpoint `Authorization` yokken veya yanlisken 401 donmeli.
- Cron response email, musteri detayi veya appointment detayi dondurmemeli.
- Admin bildirim loglari sayfasi sadece kendi organizasyon loglarini gostermeli.
- Customer dogrudan `notification_jobs` veya `notification_logs` okuyamamali.

## Production Notu

Yeni RLS migration production Supabase veritabanina uygulanmalidir:

- `supabase/migrations/20260717_notification_logs_admin_select_policy.sql`
