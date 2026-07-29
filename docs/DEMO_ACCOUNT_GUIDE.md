# Artexo Demo Account Guide

Bu doküman satış ve teknik demo için ayrı bir demo işletme paneli hazırlama adımlarını özetler. Demo hesaplar gerçek müşteri verisiyle aynı organization içinde kullanılmamalıdır.

## Önerilen Demo Yapısı

- Ayrı bir organization: `Artexo Demo`
- Ayrı bir admin auth kullanıcısı
- Ayrı bir customer auth kullanıcısı
- Demo public booking slug: örnek `/book/artexo-demo`
- Demo veriler için `scripts/seed-demo-data.mjs`

## Güvenlik Kuralları

- Gerçek müşteri adı, telefon, e-posta veya randevu kullanma.
- Demo admin kullanıcısını sadece demo organization içine bağla.
- Demo customer kullanıcısını sadece demo organization içindeki demo client kaydına bağla.
- Demo şifrelerini production ekip dışına kontrolsüz paylaşma.
- Demo veriler bozulursa seed script ile tekrar toparla.
- Demo organization üzerinde yapılan değişikliklerin gerçek müşterileri etkilemediğini manuel doğrula.

## Otomatik Provision Script

Demo admin ve demo customer hesabını oluşturmak için:

```powershell
$env:ALLOW_DEMO_ACCOUNT_PROVISION="true"
$env:DEMO_ORG_ID="<demo-organization-uuid>"
$env:DEMO_ORG_NAME="Artexo Demo"
$env:DEMO_PUBLIC_SLUG="artexo-demo"
$env:DEMO_ADMIN_EMAIL="<demo-admin-email>"
$env:DEMO_ADMIN_PASSWORD="<strong-demo-admin-password>"
$env:DEMO_CUSTOMER_EMAIL="<demo-customer-email>"
$env:DEMO_CUSTOMER_PASSWORD="<strong-demo-customer-password>"
npm.cmd run demo:accounts -- --dry-run
```

Dry-run doğruysa:

```powershell
npm.cmd run demo:accounts
```

Script şunları yapar:

- Demo admin auth kullanıcısını oluşturur veya mevcutsa şifresini günceller.
- Demo customer auth kullanıcısını oluşturur veya mevcutsa şifresini günceller.
- Demo admin kullanıcısını `org_members` ile demo organization'a bağlar.
- `organization_profiles` kaydını ve public slug değerini hazırlar.
- Demo customer için aktif `clients` kaydı oluşturur veya günceller.

## Manuel Kurulum Alternatifi

1. Supabase Auth içinde demo admin kullanıcısı oluştur.
2. Supabase Auth içinde demo customer kullanıcısı oluştur.
3. Demo organization UUID oluştur veya mevcut demo organization UUID değerini kullan.
4. `org_members` tablosunda demo admin kullanıcısını demo organization ile ilişkilendir.
5. `organization_profiles` içine demo organization için ad ve public slug ekle.
6. Demo customer için `clients` tablosunda aktif kayıt oluştur ve `user_id` alanına demo customer auth user id değerini yaz.
7. Demo verileri seed script ile yükle.
8. Demo login bilgilerini sadece kontrollü demo paylaşımı için kullan.

## Demo Seed

Dry-run:

```powershell
$env:ALLOW_DEMO_SEED="true"
$env:DEMO_ORG_ID="<demo-organization-uuid>"
npm.cmd run seed:demo -- --dry-run
```

Gerçek yazma:

```powershell
$env:ALLOW_DEMO_SEED="true"
$env:DEMO_ORG_ID="<demo-organization-uuid>"
npm.cmd run seed:demo
```

Önerilen sıra:

1. `npm.cmd run demo:accounts -- --dry-run`
2. `npm.cmd run demo:accounts`
3. `npm.cmd run seed:demo -- --dry-run`
4. `npm.cmd run seed:demo`

## Demo Linkleri

Paylaşılabilecek kontrollü demo alanları:

- İşletme girişi: `/login`
- Müşteri girişi: `/customer/login`
- Public booking: `/book/<demo-slug>`

Admin panel hesabını herkese açık yorumlarda paylaşma. Gerekirse kişiye özel geçici demo hesabı oluştur.
