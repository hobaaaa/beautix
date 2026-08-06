# Artexo Demo Data Guide

Bu seed altyapisi yalnizca kontrollu development veya demo organization icin tasarlanmistir. Deploy, build veya startup sirasinda otomatik calismaz.

## Guvenlik Kurallari

- Gercek production organization uzerinde calistirmayin.
- Script sadece `DEMO_ORG_ID` ile verilen tek organization icin calisir.
- `ALLOW_DEMO_SEED=true` olmadan calismaz.
- Supabase Auth kullanicisi olusturmaz.
- Customer invite, reset password, Resend veya notification job tetiklemez.
- `notification_jobs` ve `notification_logs` tablolarina kayit eklemez.
- Secret degerlerini loglamaz.

## Gerekli Env Degerleri

Gercek degerleri dokumana yazmayin.

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `DEMO_ORG_ID`
- `DEMO_LOCALE=tr|en` (opsiyonel, varsayılan `tr`)
- `ALLOW_DEMO_SEED=true`

`DEMO_ORG_ID`, demo verinin eklenecegi organization UUID degeridir. Bu organization icin `org_members` kaydi mevcut olmalidir.

Script local calistirmada `.env.local` dosyasini okur; shell env degerleri varsa onlari ezmez.

## Dry Run

DB'ye write yapmadan planlanan veri adetlerini ve organization dogrulamasini kontrol eder:

```bash
set ALLOW_DEMO_SEED=true
set DEMO_ORG_ID=<organization-uuid>
npm.cmd run seed:demo -- --dry-run
```

PowerShell icin:

```powershell
$env:ALLOW_DEMO_SEED="true"
$env:DEMO_ORG_ID="<organization-uuid>"
$env:DEMO_LOCALE="tr"
npm.cmd run seed:demo -- --dry-run
```

## Gercek Calistirma

```powershell
$env:ALLOW_DEMO_SEED="true"
$env:DEMO_ORG_ID="<organization-uuid>"
$env:DEMO_LOCALE="tr"
npm.cmd run seed:demo
```

## Olusturulan Demo Icerik

Yaklasik veri seti:

- 6 personel, biri pasif
- 8 hizmet, biri pasif
- 20 musteri, son 2 kayit pasif
- 6 gun working hours
- Staff-service mapping
- Yaklasik 40 appointment

`DEMO_LOCALE="en"` kullanılırsa demo hizmet, personel ve müşteri isimleri İngilizce oluşturulur.

Appointment durumlari:

- Gecmis: `completed`, `no_show`, `cancelled`
- Bugun/gelecek: `confirmed`, `cancelled`

Gelecekte `completed` veya `no_show` appointment olusturulmaz.

## Idempotency

Script tekrar calistirildiginda duplicate veri uretmemek icin sabit marker kullanir:

- Personel ve hizmet adlari: `[DEMO] ...`
- Musteri email adresleri: `artexo-demo-client-XX@example.com`
- Musteri ve appointment notlari: `ARTEXO_DEMO_DATA_V1`

Script gercek verileri isim benzerligiyle silmez veya guncellemez. Mevcut gercek appointment ile cakisan demo appointment planlari atlanir.

## Cleanup

Bu kartta otomatik cleanup scripti yoktur. Demo veriyi temizlemek gerekiyorsa once kayitlarin demo marker tasidigini manuel dogrulayin. Appointment delete is kurallarini veya FK'leri zorlamayin; demo client/staff/service kayitlarini pasife almak daha guvenlidir.
