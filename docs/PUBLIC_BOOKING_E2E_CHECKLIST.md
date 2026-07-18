# Public Booking E2E Checklist

Bu checklist public booking akışını production öncesi veya kontrollü staging ortamında manuel test etmek için kullanılır. Gerçek müşteri organization’ı kullanılmamalıdır. Kontrollü demo organization ve test e-posta adresleri kullanılmalıdır.

Her satırda “Geçti/Kaldı” alanını test sonucuna göre işaretleyin.

## Temel Akış

| İşlem | Beklenen Sonuç | Geçti/Kaldı |
| --- | --- | --- |
| `/book/<slug>` açılır. | Sayfa açılır ve işletme adı görünür. | [ ] |
| Geçersiz slug açılır. | Güvenli 404 veya kullanıcı dostu bulunamadı ekranı görünür. | [ ] |
| Aktif hizmet listesi görüntülenir. | Aktif hizmetler görünür. | [ ] |
| Pasif hizmet kontrol edilir. | Pasif hizmet görünmez. | [ ] |
| Geçersiz `serviceId` denenir. | Güvenli mesaj görünür, booking devam etmez. | [ ] |
| Başka organization service ID denenir. | Service kabul edilmez. | [ ] |

## Tarih

| İşlem | Beklenen Sonuç | Geçti/Kaldı |
| --- | --- | --- |
| Geçmiş tarih seçilir. | Tarih reddedilir veya devam edilemez. | [ ] |
| Bugün seçilir. | Bugün kabul edilir. | [ ] |
| Gelecek tarih seçilir. | Gelecek tarih kabul edilir. | [ ] |

## Staff

| İşlem | Beklenen Sonuç | Geçti/Kaldı |
| --- | --- | --- |
| Seçili hizmete tek aktif staff atanır. | Staff otomatik seçilir. | [ ] |
| Seçili hizmete birden fazla aktif staff atanır. | Staff seçim adımı görünür. | [ ] |
| Pasif staff kontrol edilir. | Pasif staff görünmez. | [ ] |
| Hizmet mapping’i olmayan staff kontrol edilir. | Mapping olmayan staff görünmez. | [ ] |
| Başka organization staff ID denenir. | Staff kabul edilmez. | [ ] |

## Slotlar

| İşlem | Beklenen Sonuç | Geçti/Kaldı |
| --- | --- | --- |
| Dolu slot kontrol edilir. | Dolu slot görünmez. | [ ] |
| Cancelled appointment slotu kontrol edilir. | Cancelled appointment slotu kapatmaz. | [ ] |
| Bugün geçmiş saat kontrol edilir. | Geçmiş saat görünmez. | [ ] |
| Working hours dışı saat kontrol edilir. | Mesai dışı slot görünmez. | [ ] |
| Hizmet süresi mesai bitişini aşan slot kontrol edilir. | Slot görünmez. | [ ] |

## Confirm

| İşlem | Beklenen Sonuç | Geçti/Kaldı |
| --- | --- | --- |
| Confirm sayfası açılır. | Hizmet, personel, tarih ve saat özeti görünür. | [ ] |
| Query parametreleri manipüle edilir. | Service/staff/date/time server-side yeniden doğrulanır. | [ ] |
| Confirm ekranındayken slot başka randevuyla doldurulur. | Submit sırasında güvenli 409 döner. | [ ] |
| Success sayfası açılır. | Hassas müşteri verisi gösterilmez. | [ ] |
| Success sayfasındaki yeni randevu linki kullanılır. | Public booking başlangıcına döner. | [ ] |

## Guest Form

| İşlem | Beklenen Sonuç | Geçti/Kaldı |
| --- | --- | --- |
| Ad boş bırakılır. | Zorunlu alan hatası görünür. | [ ] |
| Soyad boş bırakılır. | Zorunlu alan hatası görünür. | [ ] |
| Telefon boş bırakılır. | Zorunlu alan hatası görünür. | [ ] |
| E-posta boş bırakılır. | Zorunlu alan hatası görünür. | [ ] |
| Consent işaretlenmez. | Devam edilemez. | [ ] |
| Notes boş bırakılır. | Booking devam edebilir. | [ ] |
| Uzun notes girilir. | Maksimum uzunluk korunur. | [ ] |

## Contact Normalization

| İşlem | Beklenen Sonuç | Geçti/Kaldı |
| --- | --- | --- |
| Aynı telefon farklı formatlarla girilir. | Duplicate client oluşmaz. | [ ] |
| Büyük harfli e-posta girilir. | E-posta lowercase normalize edilir. | [ ] |
| Yeni contact ile booking yapılır. | Yeni client oluşturulur. | [ ] |
| Mevcut contact ile booking yapılır. | Mevcut client kullanılır. | [ ] |
| Mevcut client bilgileri farklı değerlerle denenir. | Mevcut client gereksiz overwrite edilmez. | [ ] |
| E-posta ve telefon iki farklı client’a eşleşir. | Booking oluşmaz. | [ ] |
| Pasif client eşleşir. | Booking oluşmaz. | [ ] |

## Appointment

| İşlem | Beklenen Sonuç | Geçti/Kaldı |
| --- | --- | --- |
| Başarılı public booking yapılır. | Appointment oluşur. | [ ] |
| Appointment status kontrol edilir. | Status `confirmed` olur. | [ ] |
| Appointment organization kontrol edilir. | Doğru org/client/service/staff ilişkisi vardır. | [ ] |
| Appointment saatleri kontrol edilir. | `start_at` ve `end_at` hizmet süresine göre doğrudur. | [ ] |
| Aynı staff/slot için ikinci booking denenir. | İkinci booking reddedilir. | [ ] |

## Notifications

| İşlem | Beklenen Sonuç | Geçti/Kaldı |
| --- | --- | --- |
| Başarılı booking sonrası job kontrol edilir. | `booking_confirmation` job oluşur. | [ ] |
| Başarılı booking sonrası işletme job kontrol edilir. | `business_booking_notification` job oluşur. | [ ] |
| Randevu 24 saatten uzaksa reminder kontrol edilir. | `appointment_reminder` job oluşur. | [ ] |
| Randevu 24 saatten yakınsa reminder kontrol edilir. | Reminder job oluşmaz. | [ ] |
| Cron çalıştırılır. | Job `sent` veya `failed` sonucuna gider. | [ ] |
| Notification log kontrol edilir. | Her deneme için log oluşur. | [ ] |
| Customer email kontrol edilir. | Booking confirmation alınır. | [ ] |
| Business email kontrol edilir. | Yeni randevu bildirimi alınır. | [ ] |

Test email adresleri gerçek kişilere ait olmamalıdır veya test için açık onay alınmış olmalıdır.

## Spam ve Rate Limit

| İşlem | Beklenen Sonuç | Geçti/Kaldı |
| --- | --- | --- |
| Honeypot dolu request gönderilir. | Write yok, booking oluşmaz. | [ ] |
| 2 saniyeden kısa submit gönderilir. | Write yok, booking oluşmaz. | [ ] |
| Future `startedAt` gönderilir. | Request reddedilir. | [ ] |
| Aynı IP ile 10 dakikada 6. deneme yapılır. | 429 döner. | [ ] |
| Aynı IP + org ile 1 dakikada 3. deneme yapılır. | 429 döner. | [ ] |
| Aynı contact ile 30 dakikada 4. başarılı booking denenir. | 429 döner. | [ ] |
| Block sonrası client kontrol edilir. | Yeni client oluşmaz. | [ ] |
| Block sonrası appointment kontrol edilir. | Appointment oluşmaz. | [ ] |
| Block sonrası notification job kontrol edilir. | Job oluşmaz. | [ ] |
| Attempts tablosu kontrol edilir. | Raw IP/e-posta/telefon saklanmaz. | [ ] |
| 429 response kontrol edilir. | Internal reason veya hash dönmez. | [ ] |

## Cross-Tenant Güvenlik

| İşlem | Beklenen Sonuç | Geçti/Kaldı |
| --- | --- | --- |
| Slug A ile service B kullanılır. | Kabul edilmez. | [ ] |
| Slug A ile staff B kullanılır. | Kabul edilmez. | [ ] |
| Başka organization client eşleşmesi denenir. | Eşleşmez. | [ ] |
| Public RPC response’ları kontrol edilir. | Internal org/client/appointment detayları dönmez. | [ ] |
| Anon doğrudan `clients` insert dener. | RLS/policy nedeniyle başarısız olur. | [ ] |
| Anon doğrudan `appointments` insert dener. | RLS/policy nedeniyle başarısız olur. | [ ] |
| Anon `notification_jobs` veya `notification_logs` okur. | Okuyamaz. | [ ] |
| Success page `bookingId` manipüle edilir. | Detay erişimi sağlamaz. | [ ] |

## Mobile Test

| İşlem | Beklenen Sonuç | Geçti/Kaldı |
| --- | --- | --- |
| 320px genişlikte test edilir. | Kartlar taşmaz. | [ ] |
| 375px genişlikte test edilir. | Date input ve butonlar kullanılabilir. | [ ] |
| 390px genişlikte test edilir. | Staff ve slot butonları rahat kullanılır. | [ ] |
| 430px genişlikte test edilir. | Confirm ve success ekranı taşmaz. | [ ] |
| iPhone Safari test edilir. | Akış tamamlanır. | [ ] |
| iPhone Chrome test edilir. | Akış tamamlanır. | [ ] |
| Android Chrome test edilir. | Akış tamamlanır. | [ ] |
| iOS guest form test edilir. | Input zoom davranışı kabul edilebilir düzeydedir. | [ ] |
| Safe-area test edilir. | Confirm ve success ekranı safe-area ile uyumludur. | [ ] |

## Website Integration Smoke Test

| İşlem | Beklenen Sonuç | Geçti/Kaldı |
| --- | --- | --- |
| Test web sitesine “Online Randevu Al” butonu eklenir. | Buton görünür. | [ ] |
| Butona tıklanır. | Doğru slug sayfasına gider. | [ ] |
| Mobilde buton test edilir. | Link çalışır. | [ ] |
| Yeni sekme kullanılıyorsa HTML kontrol edilir. | `rel="noopener noreferrer"` vardır. | [ ] |
| Slug değiştirilir. | Eski web sitesi linkinin güncellenmesi gerektiği doğrulanır. | [ ] |

## Minimal Code Review

| Kontrol | Beklenen Sonuç | Geçti/Kaldı |
| --- | --- | --- |
| Public booking route’larında debug `console.log` aranır. | Debug log yoktur. | [ ] |
| Server logları incelenir. | Guest isim, telefon, e-posta veya notes loglanmaz. | [ ] |
| IP logging kontrol edilir. | Raw IP loglanmaz. | [ ] |
| Response payload kontrol edilir. | Secret veya hash response’a yazılmaz. | [ ] |
| Geçici metin aranır. | “Hazırlanıyor” gibi geçici metin kalmaz. | [ ] |
| README public booking bölümü kontrol edilir. | Public booking tamamlanmış kapsamla anlatılır. | [ ] |
| Customer portal akışı kontrol edilir. | Mevcut davranış değişmemiştir. | [ ] |
| Booking iş kuralları kontrol edilir. | Rate-limit dışında iş kuralları değişmemiştir. | [ ] |

## Notlar

- Bu checklist otomatik test framework’ü değildir.
- Gerçek production organization üzerinde kullanılmamalıdır.
- Test scripti eklenirse güvenlik bayrağı olmadan çalışmamalıdır.
- Public booking rate-limit sayıları gerçek trafik verisine göre ileride ayarlanabilir.
