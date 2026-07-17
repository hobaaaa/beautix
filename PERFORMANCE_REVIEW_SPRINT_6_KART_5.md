# Artexo Performance Review - Sprint 6 Kart 5

Tarih: 2026-07-17

## Degisiklik Oncesi Tespitler

- `npm.cmd run build` basariliydi; kullaniciya/tenant'a ozel route'lar dynamic kaldi.
- Admin ve customer sayfalarinda auth/org context tekrarlarini azaltan `cache()` ve page-level context paylasimi zaten mevcut.
- Admin appointments sayfasi bagimsiz verileri `Promise.all` ile paralel getiriyor.
- Customer booking busy appointment sorgusu sadece secili gun ve personel icin calisiyor; tum gecmis veri cekilmiyor.
- Availability dogrulamasinda cancelled appointment'lar helper icinde filtreleniyordu, ancak bazi sorgular cancelled kayitlari DB'den gereksiz tasiyordu.
- Notification logs sorgusu `org_id + created_at desc limit 100`, cron claim sorgusu `pending + scheduled_for`, customer/admin appointment gecmisi ise `org_id + client_id + start_at` pattern'i kullaniyor.
- Dashboard bugun/yarin appointment kartlari count ayri hesaplandigi halde liste sorgulari gun icindeki tum kayitlari cekiyordu.

## Uygulanan Optimizasyonlar

- Admin create/update/available-slots availability sorgularina `status <> cancelled` filtresi eklendi.
- Customer busy appointments RPC'si cancelled kayitlari dondurmeyecek sekilde guncellendi.
- Dashboard bugun/yarin liste sorgulari 8 kayit ile sinirlandi; count degerleri ayri count sorgularindan dogru kalmaya devam ediyor.
- Sorgu pattern'lerine gore minimal composite index migration'i eklendi:
  - `appointments (org_id, client_id, start_at desc)`
  - `appointment_types (org_id, is_active, name)`
  - `notification_jobs (scheduled_for, created_at) where status = pending`
  - `notification_logs (org_id, created_at desc)`

## Degisen Dosyalar

- `app/admin/queries.ts`
- `app/api/admin/appointments/route.ts`
- `app/api/admin/appointments/[id]/route.ts`
- `app/api/admin/appointments/available-slots/route.ts`
- `supabase/migrations/20260717_performance_indexes_and_busy_slots.sql`

## Production Notlari

- Yeni migration production Supabase veritabanina uygulanmalidir:
  - `supabase/migrations/20260717_performance_indexes_and_busy_slots.sql`
- Vercel/Supabase region uyumu koddan dogrulanamadi; production panelinde manuel kontrol edilmelidir.
- Daha buyuk veri setlerinde appointments icin pagination/infinite scroll halen ayri bir kart olarak degerlendirilebilir.

## Manuel Test Checklist

- Admin dashboard bugun/yarin sayilari dogru gorunmeli.
- Admin appointment list/create/update akislari calismali.
- Admin slot listesi iptal edilmis randevulari dolu saymamali.
- Customer booking slot listesi iptal edilmis randevulari dolu saymamali.
- Customer booking confirm ve appointment create akisi calismali.
- Notification logs sayfasi son kayitlari gostermeli.
- Mobil PWA ana akislari ve login yonlendirmeleri bozulmamali.
