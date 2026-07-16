# 🎓 Stylish Campus — Kampüs İçi İkinci El Pazarı

[![Next.js](https://img.shields.io/badge/Next.js-13.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Radix_UI-black?style=flat-square)](https://ui.shadcn.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Stylish Campus**, üniversite öğrencileri ve personeli arasında güvenli, sürdürülebilir ve masrafsız ikinci el kıyafet ile eşya alışverişi sağlamak amacıyla geliştirilmiş modern bir web uygulaması prototipidir. 

---

## 📌 Projenin Amacı ve Vizyonu

Geleneksel ikinci el platformlarında karşılaşılan **yüksek kargo ücretleri, komisyon kesintileri, güvenilmez satıcı profilleri ve kurye gecikmeleri** gibi sorunlar öğrenciler için büyük bir engel teşkil etmektedir. **Stylish Campus**, bu sorunları kampüs ekosisteminin doğasından gelen güven ilişkisiyle çözmeyi amaçlar:

*   **Sadece Öğrenciler:** Yalnızca `.edu.tr` uzantılı kurumsal e-posta adresine sahip üniversite mensupları platforma katılabilir.
*   **Sıfır Maliyet (Kargo ve Komisyon Yok):** Alışverişler tamamen elden teslim (meetup) yöntemiyle, kampüs içindeki belirli ortak noktalarda gerçekleştirilir.
*   **Sürdürülebilirlik:** Kampüs içi döngüsel ekonomiyi destekleyerek tüketim çılgınlığını azaltmayı ve öğrenci bütçesine katkı sağlamayı hedefler.
*   **Sunucu Bağımsız Hızlı Deneyim:** Web sitesi test aşamasında olduğu için tüm işlemler tarayıcıda simüle edilir; kurulum ve test aşamalarında harici bir veritabanı veya sunucu gerektirmez.

---

## ✨ Öne Çıkan Özellikler

Platform, modern bir e-ticaret ve sosyal pazar uygulamasından beklenen tüm temel işlevleri şık bir kullanıcı deneyimi ile sunar:

*   🔒 **.edu.tr E-posta & OTP Simülasyonu:** Sadece üniversite e-postaları ile kayıt. Güvenli giriş aşamasında gerçek e-posta trafiği yerine arayüzde anlık gösterilen simüle edilmiş Tek Kullanımlık Şifre (OTP) doğrulaması.
*   🤝 **Kampüs İçi Elden Teslim (Meetup) Akışı:** Belirlenen kampüs konumlarında (örneğin: *Merkez Kütüphane Önü, Mühendislik Kantini*) buluşma planlama. Sipariş oluşturma, satıcı onayı ve alıcı onayı ile tamamlanan 3 aşamalı güvenli teslimat süreci.
*   📸 **Akıllı Görsel Sıkıştırma (Client-side):** İlan oluşturulurken `browser-image-compression` kullanılarak resimler otomatik olarak WebP formatına dönüştürülür ve maksimum 1080x1080px çözünürlük ile **150 KB** altına düşürülür. Bu sayede tarayıcı depolama kotası (localStorage) verimli şekilde korunur.
*   🔍 **Gelişmiş Arama ve Filtreleme:** Kategori, beden, kullanım durumu (Sıfır, Az Kullanılmış vb.), fiyat aralığı ve kampüs konumuna göre gerçek zamanlı dinamik filtreleme ve sıralama.
*   💬 **Simüle Edilmiş Canlı Mesajlaşma (Chat):** İlan detayından anında alıcı-satıcı arası sohbet başlatma, okunmamış mesaj sayacı ve gerçek zamanlı mesajlaşma arayüzü.
*   ⭐ **Değerlendirme (Rating) & Puanlama:** Tamamlanan işlemlerden sonra alıcının satıcıya 1-5 yıldız arası puan vermesi ve satıcı profillerinde ortalama puanların dinamik listelenmesi.
*   🛡️ **Gelişmiş Yönetici (Admin) Paneli:** Kullanıcıların ve ilanların denetimi. Kurallara uymayan kullanıcıları yasaklama (ban) ve uygunsuz ilanları yayından kaldırma özellikleri. (Banlanan kullanıcının tüm ilanları otomatik olarak sistemden kaldırılır).
*   ❤️ **Favori Listesi:** Beğenilen ürünleri kaydedip profil sekmesinden kolayca takip edebilme.
*   🔄 **Çoklu Sekme Senkronizasyonu (Cross-tab Sync):** Tarayıcının `storage` event'leri dinlenerek, yan sekmelerde yapılan değişikliklerin (örneğin mesaj alma, ilan ekleme, favoriye alma) aktif sekmede de anında güncellenmesi.

---

## 🛠️ Kullanılan Teknolojiler

| Kategori | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Çekirdek** | [Next.js v13.5](https://nextjs.org/) | App Router mimarisine sahip React framework'ü. |
| **Programlama Dili** | [TypeScript](https://www.typescriptlang.org/) | Tip güvenliği ve ölçeklenebilir kod mimarisi. |
| **Stil ve Tasarım** | [Tailwind CSS](https://tailwindcss.com/) | Hızlı, modern ve responsive (mobil uyumlu) UI tasarımı. |
| **Bileşen Kütüphanesi** | [shadcn/ui](https://ui.shadcn.com/) | Radix UI tabanlı, erişilebilirliği yüksek arayüz bileşenleri. |
| **İkonlar** | [Lucide React](https://lucide.dev/) | Modern ve sade vektörel ikon seti. |
| **Form Yönetimi** | [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) | Şema tabanlı form doğrulamaları ve güvenli input yönetimi. |
| **Resim İşleme** | [browser-image-compression](https://www.npmjs.com/package/browser-image-compression) | Tarayıcı tarafında WebP sıkıştırma. |
| **Bildirimler** | [Sonner](https://sonner.emilkowal.ski/) | Şık ve özelleştirilebilir toast (tost) bildirimleri. |
| **Veri Depolama** | `localStorage` API | İstemci tarafında çalışan ilişkisel mockup veri deposu. |

---

## 📂 Proje Yapısı ve Dosya Analizi

Proje, temiz kod standartlarına ve **modüler mimariye** uygun olarak tasarlanmıştır. Bu dizinin altındaki detaylı yapı aşağıda açıklanmıştır:

```text
.
├── app/                  # Next.js App Router (Sayfa ve Rotalar)
│   ├── globals.css       # Global stiller ve Tailwind CSS tanımları
│   ├── layout.tsx        # Kök layout ve tema/provider sarmalayıcıları
│   ├── page.tsx          # Ana giriş noktası (Giriş durumuna göre AppShell veya Login yönlendirir)
│   └── login/
│       └── page.tsx      # E-posta girişi, OTP simülasyonu ve profil oluşturma adımları
├── components/           # UI Bileşenleri
│   ├── app-shell.tsx     # Uygulamanın ana iskeleti (Header, Navigasyon, Arama ve Sekme yönetimi)
│   ├── product-card.tsx  # Feed üzerindeki her bir ürünün kart bileşeni
│   ├── ui/               # Radix UI / shadcn kaynaklı atomik bileşenler (Button, Dialog, Input, vb.)
│   └── views/            # Uygulama içindeki dinamik sekmelerin görünümleri
│       ├── feed.tsx              # Ürün akışı, arama barı ve filtreleme alanı
│       ├── product-detail.tsx    # Ürün ayrıntıları, sohbet başlatma ve meetup onaylama
│       ├── listing-form.tsx      # İlan ekleme ve düzenleme formu (Görsel sıkıştırma entegrasyonlu)
│       ├── chat-list.tsx         # Aktif mesajlaşmaların ve son mesajların listesi
│       ├── chat.tsx              # Alıcı ile satıcı arasındaki sohbet ekranı
│       ├── profile.tsx           # Kullanıcı profili, kendi ilanları, favorileri ve puanları
│       ├── transactions.tsx      # Elden teslimat (meetup) adımları ve işlem geçmişi
│       └── admin.tsx             # Yönetici kontrol paneli (Banlama ve ilan kaldırma)
├── hooks/                # Özel React Hook'ları
│   └── use-toast.ts      # Bildirim yönetimi için yardımcı kanca
├── lib/                  # Veri Modelleri, Yardımcı Fonksiyonlar ve State Yönetimi
│   ├── types.ts          # TypeScript arayüzleri (User, Product, Message vb.) ve sabitler
│   ├── store.ts          # localStorage veri erişim katmanı (Seed yükleme, CRUD ve Tab senkronizasyonu)
│   ├── auth.tsx          # useAuth bağlamı (Giriş/Çıkış, OTP doğrulama ve Profil güncelleme mantığı)
│   ├── nav.tsx           # useNav bağlamı (İstemci tarafı sayfa geçmişi [backstack] ve yönlendirme)
│   ├── image.ts          # browser-image-compression entegrasyonu ve boyut kontrolleri
│   ├── format.ts         # Para birimi, tarih ve göreceli zaman ("3 saat önce") formatlayıcıları
│   └── seed.ts           # Uygulamanın ilk çalışmasında veritabanını dolduran örnek veriler
```

### Mimari Detaylar ve Akışlar

1.  **State ve Rota Yönetimi (`lib/nav.tsx`):**
    Uygulama, Next.js sunucu yönlendirmesi yerine istemci tarafında çok daha hızlı çalışan **state-based routing (durum tabanlı yönlendirme)** kullanır. `useNav` hook'u sayesinde sayfa geçişleri, geçmiş yığını (backstack) üzerinde tutulur ve tarayıcı yenilenmeden anlık olarak sekmeler arası geçiş yapılır.
2.  **Veri Depolama ve Erişim (`lib/store.ts`):**
    Uygulamadaki tüm veri tabloları (Kullanıcılar, Ürünler, Mesajlar, İşlemler, Değerlendirmeler) tarayıcının `localStorage` alanında `dd_*` anahtarlarıyla JSON formatında tutulur. `store.ts`, bu verilere erişimi tek bir noktadan yöneterek hata payını azaltır ve veri bütünlüğünü korur.
3.  **Kimlik Doğrulama (`lib/auth.tsx`):**
    `AuthProvider` bileşeni, kullanıcının oturum durumunu takip eder. `.edu.tr` formatına uygun e-postalar için rastgele 6 haneli OTP kodu üretir ve prototip kolaylığı olması açısından bu kodu **ekranda tost bildirimi (toast) olarak** kullanıcıya sunar.

---

## 🚀 Kurulum ve Çalıştırma

Projenin lokal ortamınızda çalıştırılması oldukça basittir:

### Gereksinimler
*   [Node.js](https://nodejs.org/) (v18.x veya daha yeni bir sürüm)
*   [npm](https://www.npmjs.com/) veya [yarn](https://yarnpkg.com/) paket yöneticisi

### Kurulum Adımları

1.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    # veya
    yarn install
    ```

2.  **Uygulamayı Geliştirme Modunda Çalıştırın:**
    ```bash
    npm run dev
    # veya
    yarn dev
    ```

3.  **Tarayıcıda Açın:**
    Terminalde sunucu başladıktan sonra tarayıcınızdan **`http://localhost:3000`** adresine giderek uygulamayı kullanmaya başlayabilirsiniz.

---

## 💡 Demo Giriş Bilgileri

Uygulamanın ilk açılışında `localStorage` alanında otomatik olarak örnek (seed) veriler oluşturulur. Test etmek için aşağıdaki e-postaları kullanabilirsiniz:

*   **Öğrenci Girişi (Alıcı/Satıcı):**
    *   **E-posta:** `elif.yilmaz@boun.edu.tr` veya `mehmet.demir@metu.edu.tr`
    *   *Giriş yap butonuna bastıktan sonra ekranın sağ üst/alt köşesinde belirecek olan 6 haneli doğrulama kodunu girmeniz yeterlidir.*
*   **Yönetici Girişi (Admin):**
    *   **E-posta:** `admin@universite.edu.tr`
    *   *Yönetici rolüyle giriş yaptıktan sonra sağ üstteki kullanıcı menüsünden **"Yönetim Paneli"**ne erişebilir, kullanıcıları yasaklayabilir veya ilanları yönetebilirsiniz.*

---

## 📄 Lisans

Bu proje **MIT Lisansı** kapsamında lisanslanmıştır. Detaylar için `LICENSE` dosyasına göz atabilirsiniz.
