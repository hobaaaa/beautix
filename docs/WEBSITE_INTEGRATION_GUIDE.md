# Artexo Website Integration Guide

Bu doküman, işletme web sitesine Artexo public booking linkinin nasıl ekleneceğini açıklar. Gerçek production domain, secret veya müşteri bilgisi bu dokümana yazılmamalıdır.

## Önerilen MVP Entegrasyon

İlk ve önerilen entegrasyon modeli link tabanlıdır:

```txt
https://<artexo-domain>/book/<organization-slug>
```

İşletme web sitesine “Randevu Al” butonu eklenir ve buton Artexo public booking linkine yönlenir.

Avantajlar:

- Hızlı uygulanır.
- Mobil uyumludur.
- CORS gerektirmez.
- iframe kaynaklı görünüm ve güvenlik sorunları oluşturmaz.
- Bakımı kolaydır.

Bu sprintte iframe, widget, embedded modal veya custom domain önerilen MVP çözümü değildir. Bunlar V2 kapsamındadır.

## HTML Örneği

Yeni sekmede açmak için:

```html
<a
  href="https://<artexo-domain>/book/<organization-slug>"
  target="_blank"
  rel="noopener noreferrer"
>
  Online Randevu Al
</a>
```

Aynı sekmede açmak isterseniz `target="_blank"` kullanmayabilirsiniz:

```html
<a href="https://<artexo-domain>/book/<organization-slug>">
  Online Randevu Al
</a>
```

Yeni sekme kullanılıyorsa güvenlik için `rel="noopener noreferrer"` eklenmelidir.

## Next.js Örneği

Aynı uygulama içi yönlendirme veya statik link için:

```tsx
import Link from "next/link";

export function BookingButton() {
  return (
    <Link href="https://<artexo-domain>/book/<organization-slug>">
      Online Randevu Al
    </Link>
  );
}
```

Harici domain kullanılıyorsa normal `<a>` etiketi de uygundur. Özel SDK veya ek package gerekmez.

## WordPress Entegrasyonu

Gutenberg:

1. Sayfayı veya menüyü düzenleyin.
2. Button block ekleyin.
3. Buton metnini “Online Randevu Al” yapın.
4. Link alanına `https://<artexo-domain>/book/<organization-slug>` yazın.
5. Yeni sekmede açılacaksa ilgili ayarı etkinleştirin.

Elementor:

1. Button widget ekleyin.
2. Text alanına “Online Randevu Al” yazın.
3. Link alanına public booking URL değerini girin.
4. İsterseniz yeni sekmede açma ayarını etkinleştirin.

WordPress plugin yazılması gerekmez. Gerekirse Custom HTML bloğuna HTML örneği eklenebilir.

## CTA Önerileri

Genel buton metinleri:

- Online Randevu Al
- Hemen Randevu Oluştur
- Uygun Saatleri Gör
- Randevunuzu Planlayın

Sektör örnekleri:

- Diş hekimi: “Muayene Randevusu Al”
- Güzellik merkezi: “Uygun Bakım Saatlerini Gör”
- Psikolog: “Görüşme Randevusu Planla”
- Fizyoterapist: “Seans Randevusu Al”

## Public URL Yönetimi

Public URL formatı:

```txt
/book/[slug]
```

Admin, public slug değerini `/admin/settings` üzerinden yönetir. Slug değişirse eski link çalışmaz. Bu durumda işletme web sitesindeki buton linki de güncellenmelidir.

Slug önerileri:

- Kısa ve okunabilir olmalı.
- İşletme adıyla tutarlı olmalı.
- Sık değiştirilmemeli.

Public slug auth yetkisi sağlamaz. Slug yalnızca public booking sayfasının adresidir; multi-tenant güvenlik server-side doğrulamalar ve RLS/RPC katmanıyla korunur.

## Branding

Public booking ekranı şu an Artexo domaininde çalışır. İşletme adı public booking ekranında görünür.

Şu özellikler mevcut değildir:

- İşletmeye özel logo
- İşletmeye özel renk teması
- İşletmeye özel public booking tema ayarları
- White-label görünüm
- Custom domain veya subdomain

Custom domain/subdomain V2 kapsamındadır:

```txt
randevu.isletme.com
```

## QR Code Kullanımı

Public booking linki QR code’a dönüştürülerek kullanılabilir:

- İşletme kartı
- Masa üstü tabela
- Instagram bio
- Google Business Profile
- Basılı kampanya materyali

Bu projede QR generator geliştirilmemiştir. QR oluşturma işlemi ayrı araçlarla yapılabilir.

## V2 Entegrasyon Seçenekleri

Bu sprintin kapsamı dışında kalan seçenekler:

- `widget.js`
- iframe booking
- embedded modal
- custom domain
- custom subdomain
- tenant branding
- white-label branding
- QR generator
- analytics
- payment
