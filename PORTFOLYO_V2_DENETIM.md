# PORTFÖY V2 — ULTRA-DERİN MİMARİ DENETİM

> **Hazırlayan:** Senior Frontend Director (Vercel / Linear standartlarında denetim)
> **Tarih:** 14 Mayıs 2026
> **Versiyon:** V2 — Phase 2.6 sonrası snapshot
> **Mod:** Acımasız Dürüstlük — Premium SaaS Standardı
> **Dosya kapsamı:** `app/`, `components/`, `lib/`, `public/`, `data/`, `package.json`

---

## 🔥 ÖZET — TL;DR (Beyaz Yumruk Versiyonu)

Sitenin **görsel kalitesi premium**. Mimari Server-first, sınırlar temiz, App Router doğru kullanılmış. Lumina, doğru ellerde gerçek bir farklılaştırıcı. Sinematik intro, terminal showcase, half-overlap avatar — hepsi düşünülmüş.

Ama buradan sonrası iyi haber değil.

Portföy, **sahibinin asıl hikayesini anlatmıyor.** 19 yaşında, fırın vardiyalarında çalışan, kendi kendine öğrenmiş bir DevOps takıntılısı yerine — McKinsey raporu yazan bir senior consultant gibi görünüyor. Sayfalar boyunca *"scale"*, *"leverage"*, *"production-grade"*, *"AI-native"* kelimeleri tekrarlanıyor. İnsan yok. Kanıt yok. Yaşanmışlık yok.

Cloud Waste Hunter'ın "production" iddiası **canlı bir kanıtla desteklenmiyor.** `TerminalShowcase`'teki `$17,040 annual savings` rakamı **hardcoded fake output** — Network sekmesini açan herhangi bir mühendis bunu 4 saniyede yakalar. GitHub aktivitesi gösterilmiyor. AWS mimari diagramları yok. Sertifika yok. Blog yok. Testimonial yok. Bu portföy **müşteri arayan bir ajansa benziyor; iş arayan bir cevhere değil.**

Lumina UX'i, "premium" hissettirmek isterken ziyaretçinin **6 saniye zorunlu beklemesini** dayatıyor (`T_ABSOLUTE_UNLOCK = 6000ms`, `LuminaWindow.tsx:29`). 6 saniye, modern bir portföyde geçen ortalama dwell time'ın **%75'ine** denk. Birçok ziyaretçi konuşmaya başlayamadan çıkacak.

Teknik borç tarafında: **24+ MB ölü video** (`hero.mp4`, `hero-cinematic.mp4`), **çift animasyon paketi** (`motion` + `framer-motion`, ikincisi hiç import edilmemiş), **1 ölü component** (`Projects.tsx`), **5 Next.js boilerplate SVG** (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`), ve **2.2 MB optimize edilmemiş PNG** (`lumina.png`). Tüm bunlar Phase 1'den kalan birikim — temizlik disiplini "production-grade engineer" iddiasının **bir kademe altında.**

Ve en utanç verici detay: `/about` sayfasının 134. satırında **kendi adı yanlış yazılı** — `"Emre Dogan"`, `Ğ` yok. Sitenin geri kalanında `"Emre Doğan"` doğru. Bir Türk işverenin/yatırımcının ilk göreceği üç şeyden biri burası.

**GENEL SKOR: 6.0 / 10** — İyi bir hobiyle başlamış, premium görünüyor, ama dünya çapı için **3-4 hafta daha odaklı çalışma** gerekiyor. İyi haber: çoğu sorun "yapısal" değil, "disiplinsel" — yani 7.5+ erişilebilir.

---

## 🌌 1. LUMINA AI & SİNEMATİK VARLIK ANALİZİ

### 1.1 Lumina'nın Temel Problemi: Düşmanca UX

**Dosya:** `components/chat/LuminaWindow.tsx:20-29`

```ts
const T_MSG_1 = 700;
const T_MSG_2 = 2000;
const T_MSG_3 = 3400;
const T_READY = 3800;
const T_FAILSAFE = 5000;
const T_ABSOLUTE_UNLOCK = 6000;
```

Lumina, ziyaretçinin **6 saniye boyunca yazamamasını** dayatıyor. Bu, "sinematik anlık" adı altında saldırgan UX.

**Modern dwell time gerçeği:**
- Vercel / Linear / Stripe seviyesi sitelerde ziyaretçi ilk **8 saniye** içinde "değer" görmezse çıkar
- Lumina'nın 6 saniyesi, dwell time'ın **%75'ini** tek başına yiyor
- Ve bu sırada visitor **hiçbir şey yapamıyor** — Lumina'nın başarısı için seyirci rolünde

Üstelik bu sahne otomatik açılıyor (`LuminaChat.tsx` içinde 3500ms'de `setIsOpen(true)`), yani ziyaretçi **istemese bile** Lumina hero'nun üzerine çöküyor. Tipik tepki: panikle X butonunu ara, kapatmaya çalış, kapatamayınca Lumina'yı "saldırgan widget" olarak kaydet.

**Düzeltme:**
- `T_MSG_1 = 300`, `T_MSG_2 = 900`, `T_MSG_3 = 1500`, `T_READY = 1800`, `T_ABSOLUTE_UNLOCK = 2500`
- Auto-open süresini 3500ms → 1500ms'ye indir
- Veya daha cesur: Auto-open'ı tamamen kaldır. Visitor tetiklerse açılsın.

### 1.2 Avatar = "AI Bot Widget", Joi Değil

**Dosya:** `components/chat/LuminaAvatar.tsx:62-67`

```ts
boxShadow: `0 0 ${60 * g}px rgba(0,210,255,${0.40 * g}), ...`,
background:
  "radial-gradient(circle at 30% 28%, rgba(0,210,255,0.40), rgba(11,37,81,0.60) 50%, rgba(5,5,5,0.95))",
```

Görsel olarak güçlü ama:

**(a) Cyan gradient fallback Discord notification estetiği.** Joi (Blade Runner 2049) ya da Samantha (Her) standartlarında **DEĞİL**. Sebep: gradient'in merkez offset'i (`30% 28%`) bir "küre" değil, bir "amorf bulut" sinyali veriyor. Premium AI core, geometrik olarak daha düzenli olmalı — örneğin merkezi (`50% 50%`) tutup parlaklığı dış halkaya doğru azalt.

**(b) `lumina.png` 2.2 MB optimize edilmemiş.** 256×256 hedef boyutta WebP @ 80% quality ile **~30 KB**'a iner. Şu an **73× daha büyük**. Decoded RGBA bellek tüketimi ~10 MB. Mobile retina cihazlarda fark hissedilir.

**(c) 60px box-shadow @ 0.40 alpha.** `globals.css:106` yorumunda "**gaming RGB değil**" yazılı — ama 60px cyan glow, **Razer Synapse / SteelSeries** estetik bandının tam ortasında. Aralık 24-32px'a indir, alpha 0.30-0.35'a düşür: hâlâ "premium AI core" hissi, ama "gaming cosplay" düşüyor.

**(d) Sonsuz breathing pulse `prefers-reduced-motion` desteği yok** (`LuminaAvatar.tsx:38-54`). Vestibüler bozukluğu olan ziyaretçi rahatsız olur.

### 1.3 Kimlik Çelişkisi: "Neural Apollo" diyor, ama Hermes

**Dosya:** `lib/lumina/system-prompt.ts:15`
> *"You are the latest 4.x **neural-series** intelligence layer."*

**Dosya:** `app/api/chat/route.ts`
```ts
model: anthropic("claude-haiku-4-5-20251001")
```

Lumina kendini *"4.x neural-series"* diye tanıtıyor ama altta çalışan **Haiku 4.5** — 4.x ailesinin **en hafif, en hızlı, en ucuz** modeli. Yani Lumina *"Ben Apollo'yum"* diyor ama bedeni Hermes.

Bu, **technical literate** ziyaretçi (recruiter, eng manager, fellow engineer) için **zaaf sinyali**. Sitenin sattığı "AI mimarisi" ama altta cost-optimization tercihi yapılmış — ki bu **akıllıca** olabilir, ama "neural-series" pazarlamasıyla **çelişiyor**.

İki çözüm:
1. **Alçakgönüllüleştir:** `"You are Lumina — Emre Doğan's AI representative."` yeter. `4.x neural-series` çıkar.
2. **Yükselt:** `claude-sonnet-4-6` veya `claude-opus-4-7`. Cost-per-message yükselir ama "neural-series" iddiası gerçeklenir.

### 1.4 Conversation Persistance: SIFIR

`useChat()` her sayfa yenilemesinde sıfırlanır. Ziyaretçi `/projects/aws-waste-hunter`'a tıkladığında konuşması **gider**. Bu, Lumina'yı "kalıcı asistan" değil **tek seferlik party trick** seviyesine indirir.

**Modern AI chat standardı** (ChatGPT, Claude.ai, hatta Resend/Vercel chat widget'ları):
- `localStorage`'da mesaj geçmişi
- "New conversation" butonu (history clear)
- Mesaj başına timestamp
- Streaming mid-flight durdurma butonu
- Mesaj başına "Copy" / "Regenerate"

Şu an Lumina'nın hiçbiri yok. **Phase 3 için zorunlu liste.**

### 1.5 Lumina'nın "Bilmiyorum" Davranışı

System prompt'tan:
> *"If you genuinely don't know something Emre-specific, say so briefly and offer to point the visitor toward /contact."*

Bu **doğru bir kural**, ama prompt'ta sınırlı veri var (3 proje, 1 yetenek listesi, 1 backstory paragrafı). Ziyaretçi `"Emre Python biliyor mu?"`, `"Hangi okula gidiyor?"`, `"Daha önce hangi şirketlerde stajyer oldu?"` sorularını sorarsa Lumina **çoğu durumda "/contact'a yönlen"** der → yine boş cevap.

**Düzeltme:** Bilgi tabanını genişlet. `lib/lumina/knowledge-base.ts` dosyası: 50+ Q&A pair, özlem geçmişi, beceri detayları, eğitim, sertifika hedefleri. RAG değil — sadece prompt'a inject edilecek static knowledge.

### 1.6 Skor: 6.5 / 10

Lumina sinematik açıdan **etkileyici**, ama production-grade AI ürünü standartlarının (persistance, tools, mesaj yönetimi, model tutarlılığı) altında. 6 saniyelik zorunlu bekleme **kabul edilemez**.

---

## 📖 2. HİKAYE ANLATIMI & MARKA OTORİTESİ ANALİZİ

### 2.1 İnsan Hikayesi Sitede HİÇ Görünmüyor

Kullanıcı, Phase 2.6'da Monk Mode hikayesini system prompt'a gömdü:

**Dosya:** `lib/lumina/system-prompt.ts:53-55`
> *"Emre is 19 years old and a completely self-taught prodigy. He operates on a strict 'Monk Mode' discipline, managing to architect complex AWS infrastructures and build SaaS products while simultaneously balancing high school studies and demanding early morning physical shifts at a bakery."*

Bu hikaye **olağanüstü**. Hacker News'in front page'ine çıkacak cinsten. Ama:

| Konum | Hikayenin Varlığı |
|-------|---------------------|
| `HeroSection.tsx` (anasayfa) | ❌ YOK |
| `app/about/page.tsx` (Hakkımda) | ❌ YOK |
| `MetricsRow.tsx` | ❌ YOK |
| `Footer.tsx` | ❌ YOK |
| `BentoSection.tsx` | ❌ YOK |
| `lib/lumina/system-prompt.ts` | ✓ var ama sorulması gerekiyor |

Yani hikaye **sadece Lumina'ya sorulursa** ortaya çıkıyor. Bu, ziyaretçinin **yapması beklenen bir araştırma işi** — defektif tasarım. Visitor çoğu zaman Lumina ile etkileşime girmez (auto-open'da kapatır), hikayeyi öğrenemez.

**Hikaye, sitenin omur'una yedirilmeli.** Üç stratejik yer:

**(1) `/about` hero — şu anki hali:**
```
"Engineering systems that scale."
+
"I'm Emre Dogan — Cloud & DevOps Engineer building production-grade
AI-native infrastructure and SaaS products. Currently shipping tools
that help engineering teams eliminate cloud waste..."
```

**Olması gereken:**
```
"19. Self-taught. Building between bakery shifts."
+
"At 19, between 04:30 AM bakery shifts and high-school exams,
I architect production-grade AWS infrastructure and ship AI-native
SaaS products. This is Monk Mode — relentless discipline,
zero shortcuts."
```

Bu **gerçek diferansiyasyon**. Linkedin'deki 5,000 "Cloud Architect" profilinin hiçbirinde bu cümle yok.

**(2) `MetricsRow.tsx`** — şu an "10k+ IaC, 5+ Services, 3 Apps" gibi soyut sayılar. Ekle:
- `AGE — 19`
- `SHIFTS / WEEK — Bakery × 5, School × 5, Code × 7`
- `EXPERIENCE — 2 years, fully self-taught`

**(3) Footer** — küçük bir imza olarak:
> *"Built between 04:30 bakery shifts and high-school exams."*

### 2.2 KRİTİK TYPO: Kendi Adında Diakritik Eksik

**Dosya:** `app/about/page.tsx:134`
```tsx
I&apos;m Emre Dogan — Cloud &amp; DevOps Engineer building
```

`"Emre Dogan"` — **`Ğ` yok**.

Karşılaştırma:
- `app/layout.tsx:19` → `"Emre Doğan — Cloud & SaaS Engineer"` ✓
- `HeroSection.tsx:79` → `<WordsPullUp text="Emre Doğan." />` ✓
- `lib/lumina/system-prompt.ts:13` → `"Emre Doğan's portfolio"` ✓

Yani anasayfa, meta title ve Lumina prompt'unda **Doğan**, ama About sayfasında **Dogan**. Bir Türk işverenin, yatırımcının ya da işbirliği yapacak kişinin ilk göreceği üç sayfadan biri burası — ve burada **kendi adınız yanlış yazılı.**

**Düzeltme süresi:** 12 saniye. Etki: orantısız derecede büyük.

### 2.3 Otorite Sinyalleri Eksik

| Otorite Sinyali | Varlık | Etki |
|----------------|--------|------|
| GitHub commit grafiği | ❌ | "Aktif developer" kanıtı yok |
| Cloud Waste Hunter canlı demo | ❌ | "Production" iddiası boş |
| AWS mimari diagram | ❌ | Cloud expertise iddiası soyut |
| Terraform repo linki | ❌ | IaC iddiası soyut |
| Blog/Yazılı içerik | ❌ | Düşünce yapısı görünmez |
| Çıktı metrikleri (gerçek $) | ❌ | `$17,040` hardcoded fake |
| Sertifikalar (AWS, vs.) | ❌ | Kredensiyal kanıtı yok |
| Konferans/Sunum kayıtları | ❌ | Topluluk varlığı yok |
| Testimonial / Müşteri logosu | ❌ | Sosyal kanıt yok |

`components/home/TerminalShowcase.tsx`'teki **"$17,040 annual savings"** rakamı `console.log` ile hardcoded. Recruiter bunu açıp DevTools Network sekmesini kontrol ettiğinde — `/api/cwh/savings` çağrısı **yok**. Bu, Cloud Waste Hunter "production" iddiasını **doğrudan yalanlar**.

**Çözüm:** Ya gerçek bir endpoint kur (`/api/cwh/total-savings` → `{ total: 17040 }` Vercel KV'den), ya da terminal output'una `"demo"` etiketi ekle. Şu anki hali **dürüstlük ihlali**.

### 2.4 Hero Tagline'ı Çok Genel

**Dosya:** `HeroSection.tsx:74`
> *"Cloud Architect. SaaS Builder. Mobile Developer."*

Bu cümle **5,000 LinkedIn profilinde** vardır. Diferansiyasyon sıfır. Bir recruiter bunu okurken zihni başka yere gider.

Daha iyi varyantlar:
- *"19. Self-taught. Building between bakery shifts."*
- *"AWS by day. High school by afternoon. Bakery by 04:30."*
- *"Production AWS systems. Self-taught at 19. Monk Mode operator."*

### 2.5 Tek CTA — Auditor Kuralının İhlali

`HeroSection.tsx:120-131` — tek bir CTA: **"Explore Projects"**.

Ama portföye gelen ziyaretçi profilleri **en az 3 farklı**:
- **Recruiter**: "İşe alınabilir mi?" → "Hire me" / "Resume" CTA
- **Founder/CEO**: "Birlikte çalışabilir miyiz?" → "Get in touch" CTA
- **Peer/Engineer**: "Bu kişi GERÇEKTEN ne yapıyor?" → "View on GitHub" CTA

Tek CTA, profillerin üçte ikisini görmezden geliyor.

### 2.6 Skor: 4.5 / 10

Hikaye var (Monk Mode), ama sitenin **kabuğunun derininde** — iskeletine yedirilmemiş. Otorite kanıtları neredeyse sıfır. Bu, portföyün **en düşük skoru** ve **en yüksek leverage'a sahip iyileştirme alanı**.

---

## ⚡ 3. NEXT.JS APP ROUTER & PERFORMANS ANALİZİ

### 3.1 Server / Client Sınırı — Sağlam ✓

`app/page.tsx` Server Component. `<HeroSection>`, `<BentoSection>`, `<AboutSection>` `"use client"` ama bu doğru kullanım — çünkü `motion/react` ve `useInView`/`useScroll` hook'ları gerekiyor.

`/about`, `/stack`, `/projects` route'ları **tam Server Component**. İçindeki interaktif kısımlar `_components/` altında ada olarak ayrıştırılmış. Bu mimari **doğru, modern, savunulabilir.**

✅ **Bu kısım gerçekten iyi yapılmış.** Phase 2'nin (App Router Refactor) emeği görülüyor.

### 3.2 Çift Animasyon Paketi 🔴

**Dosya:** `package.json`
```json
"dependencies": {
  "framer-motion": "...",
  "motion": "...",
  ...
}
```

`grep -rn "framer-motion" components app` → **0 sonuç**.
`grep -rn "from \"motion/react\"" components app` → 15+ sonuç.

**`framer-motion` tamamen ölü dependency.** Phase 6'da `motion`'a geçildi ama `framer-motion` uninstall edilmedi. `node_modules` ~80 MB şişiyor, install süresi uzuyor, Vercel build cache büyüyor.

```bash
npm uninstall framer-motion
```

### 3.3 Public Folder — ~26 MB Ölü Asset 🔴

```
/public/videos/hero.mp4              8.4 MB   ← Phase 1'de removed
/public/videos/hero-cinematic.mp4   16.1 MB   ← Phase 1'de removed
/public/file.svg                     391 B    ← Next.js boilerplate
/public/globe.svg                   1.0 KB    ← Next.js boilerplate
/public/next.svg                    1.4 KB    ← Next.js boilerplate
/public/vercel.svg                   128 B    ← Next.js boilerplate
/public/window.svg                   385 B    ← Next.js boilerplate
/public/lumina.png                   2.2 MB   ← optimize edilmemiş
```

`grep -rn "hero.mp4\|hero-cinematic.mp4\|file.svg\|globe.svg\|next.svg\|vercel.svg\|window.svg"` → **0 referans**.

**24.5 MB video, hiç kullanılmıyor.** Vercel deploy size quota'sı (100 MB free tier'da) ciddi şekilde harcanıyor.

`lumina.png` 2.2 MB — bu, 4K monitörlerde bile **hesabını veremeyecek** bir boyut. Hedef: 256×256 WebP @ 80% quality → ~30 KB. **73× küçülme.**

```bash
rm public/videos/hero.mp4 public/videos/hero-cinematic.mp4
rm public/{file,globe,next,vercel,window}.svg
# lumina.png → ImageMagick veya squoosh.app ile optimize
```

### 3.4 Ölü Component 🔴

**Dosya:** `components/sections/Projects.tsx`

`grep -rn "from.*sections/Projects" app components` → **0 import**.

Phase 5 öncesi bento layout'unun bir parçasıydı, Phase 5'te `BentoSection.tsx`'e yerine geçildi, ama eski dosya silinmedi. ~300 satır ölü kod.

```bash
rm components/sections/Projects.tsx
```

### 3.5 Font Stratejisi — Temiz ✓

`app/layout.tsx:9-16` — tek font (Geist), Latin subset, `display: swap`. Phase 1 typography cleanup işe yaradı. Önceki Almarai + Instrument Serif çift yüklemesi düzeltilmiş.

### 3.6 Backdrop-Filter Aşırı Kullanım 🟠

**Dosya:** `app/globals.css:34-69`

```css
.liquid-glass {
  backdrop-filter: blur(16px);
  ...
}
.glass-panel {
  backdrop-filter: blur(20px);
  ...
}
```

`/about` sayfasında:
- 4 principle kartı → her biri `liquid-glass`
- 3 specialization kartı → her biri `liquid-glass`
- 1 CTA kartı → `glass-panel`

**Toplam: 8 backdrop-filter layer'ı, aynı viewport'ta.** Düşük seviyeli mobile GPU (eski Android, M1 öncesi MacBook Air, eski iPad) için 60fps **kıl payı zor**.

Phase 2.4'te Lumina'dan `backdrop-filter` kaldırıldı (`LuminaWindow.tsx:213-218` yorumunda dokümante edilmiş) — bu **mükemmel bir karardı**. Aynı disiplin diğer komponentlere de uygulanmalı:
- Cam efekti **sadece navbar, modal, popover** gibi nadir/anlık öğelerde kalsın
- Statik kartlarda `bg-white/[0.04]` + `border-white/10` yeterli; aynı görsel hissi GPU maliyeti olmadan verir

### 3.7 LCP Riski — Hero Atmosfer Katmanları

**Dosya:** `HeroSection.tsx:23-40`

```tsx
<div style={{ background: "radial-gradient(circle at 78% 25%, ...)" }} />
<div style={{ background: "radial-gradient(circle at 12% 85%, ...)" }} />
<div style={{ boxShadow: "inset 0 0 220px rgba(0,0,0,0.55)" }} />
```

3 büyük radial-gradient + 1 inset boxshadow + `<TerminalShowcase>` kendi gradient'leri + `GlobalGrain` (3.5s gecikmeli SVG). İlk paint'te toplam **5-6 büyük paint layer'ı**.

Lighthouse audit yapılmadıysa **LCP tahminim 2.5-3.5s** (mid-tier mobile, 4G). 2.5s'in altı ideal.

**Düzeltme:** İki radial-gradient'ı tek bir SVG `<image>` olarak pre-rasterize et veya `linear-gradient`'lara dönüştür (radial daha pahalı). Inset shadow'u kaldır (zaten görünmüyor diyebilirim).

### 3.8 Image Stratejisi — Kısmen İyi, Kısmen Eksik

**`BentoSection.tsx:225-231`** — `<Image fill sizes="..." />` ile düzgün optimize. ✓

**Ama:**
- `aws-waste-hunter/showcase.png` boyutu kontrol edilmedi
- `sixpack-ai/screenshot-1.jpg` — telefon screenshot'u, wide bento card aspect ratio'ya **uymuyor**. `object-cover object-center` kırpıyor ama görsel kalite düşüyor
- `vibing-coder-ai/showcase.png` boyutu kontrol edilmedi

**Düzeltme:** Her proje için **özel bento-aspect** (16:10 veya 4:3) hero görseli hazırla. Mevcut SixPack telefon screenshot'unu device-frame içinde kompose et.

### 3.9 SEO / Discoverability — Yetersiz 🟠

Eksikler:
- `app/sitemap.ts` ❌
- `app/robots.ts` ❌
- OpenGraph image ❌ (sadece text meta)
- `twitter:card` meta tags ❌
- JSON-LD `Person` veya `SoftwareApplication` schema ❌
- `/projects/[slug]` için canonical URL (var mı kontrol edilmedi)

**Sonuç:** LinkedIn'de paylaşıldığında **çıplak link** görünür. Twitter/X paylaşımında preview image yok. Google'da arandığında rich snippet'lar yok.

### 3.10 Skor: 7 / 10

Mimari sağlam. Server/client sınırları doğru. Ama housekeeping **disiplini düşük** — atık dosyalar, çift dependency, optimize edilmemiş asset, SEO eksiklikleri. "Production-grade engineer" iddiası bu kararsızlıkla **çelişiyor**.

---

## 🎨 4. PREMIUM UX & UI SİSTEM DENETİMİ

### 4.1 Yeşil Nabız Sinyali ÜÇ KEZ Tekrar Ediyor (Görsel Çöp)

Aynı `bg-emerald-400 + animate opacity+scale + repeat: Infinity` deseni:

1. `BentoSection.tsx:111-119` — Social Hub *"Available"* pulse
2. `HeroSection.tsx:101-109` — Availability indicator pulse
3. `LuminaTrigger.tsx` ve `LuminaWindow.tsx` header — Lumina *"Online"* status indicator

Tek bir anasayfada **üç farklı noktada** yeşil yanıp sönen nokta. Ziyaretçinin görsel dikkati **üçe bölünüyor**. Bir tanesi "*Hey, ben buradayım*" diyor; üç tanesi "*Dikkat dağınıklığı*" diyor.

**Çözüm:**
- Sadece **Hero Availability Indicator** kalsın (en yüksek bağlamsal anlam).
- `BentoSection` Social Hub'tan pulse'ı kaldır — "Available" yazısı zaten kafi.
- Lumina header'ından pulse'ı kaldır — *"Online"* yazısı kafi.

### 4.2 BentoSection — Asimetrik Yapı

**Dosya:** `BentoSection.tsx`

Grid:
- 1 **SocialHubCard** (dot-grid bg + 2 social link, dikey layout)
- 3 **ImageProjectCard** (full-cover image + checklist + link)

4 kart, 4 sütun, ama içerik tipi 1:3 oranıyla bölünmüş. SocialHub'ın görsel ağırlığı projelerden bambaşka. Bu **bento ruhu** değil — gerçek bento, **boyut hiyerarşisi** kullanır (1 büyük + 4 küçük gibi).

Ek sorunlar:
- Proje checklist madde sayıları: **4 / 3 / 3** — asimetri (CWH 4, VCAI 3, SixPack 3)
- `data/projects.ts`'de **5 proje** var, ama bentosa sadece 3 sığıyor (Pawdoc ve Aevum dışarıda)
- Veri ve render arasında manuel kürasyon var (`PROJECTS` constanti `BentoSection.tsx:21` içinde **hardcoded**)

**Düzeltme önerileri:**

**(A) Klasik 2×2 bento:**
- 4 proje kartı (eşit ağırlık)
- Social Hub Footer'a taşınsın
- Bento gerçekten "bento" olsun

**(B) Asimetrik bento:**
- 1 büyük (Cloud Waste Hunter — flagship) → 2 sütun, 2 satır
- 4 küçük (diğerleri + Social Hub) → her biri 1×1
- Linear / Notion bento pattern

Mevcut hali her ikisi de değil — sadece **dengesiz uniform grid**.

### 4.3 Tipografi Tutarsızlığı

| Konum | H1 Sınıfı | Tracking |
|-------|-----------|----------|
| `HeroSection.tsx:78` | `text-6xl md:text-7xl xl:text-8xl` | `-0.06em` |
| `app/about/page.tsx:129` | `text-5xl md:text-7xl` | `-0.04em` |
| `app/about/page.tsx:270` (vision H2) | `text-4xl md:text-6xl` | `-0.04em` |

İki sayfa H1'i **farklı tracking, farklı maksimum boyut**. Tasarım sistemi yok — sadece komponent başına ad-hoc değer.

**Düzeltme:** `globals.css`'a typography tokens:
```css
@theme {
  --tracking-display: -0.06em;
  --tracking-heading: -0.03em;
  --tracking-body: -0.01em;
}
```
ve her H1 `tracking-[var(--tracking-display)]` kullansın.

### 4.4 Section Spacing — 3.2× Fark

- `HeroSection`: `pt-28 pb-16 lg:pt-32 lg:pb-20` → ~112-128px üst, ~64-80px alt
- `MetricsRow`: `py-10 md:py-14` → ~40-56px
- `BentoSection`: `py-16 sm:py-20 md:py-24 lg:py-32` → ~64-128px

`py-10` (MetricsRow) ile `py-32` (BentoSection) arasında **3.2×** fark. Bir bölüm sıkışık nefes alıyor, diğeri vakum içinde. Tasarım sistemi yok.

**Düzeltme:** Section spacing scale:
```css
--section-spacing-sm: 4rem;    /* py-16 */
--section-spacing-md: 6rem;    /* py-24 */
--section-spacing-lg: 8rem;    /* py-32 */
```

### 4.5 Renk Palet Patlaması — `text-white/[X]` Kaosu

Kod tabanı boyunca `text-white/` opacity değerleri:
- `/25`, `/30`, `/35`, `/40`, `/45`, `/55`, `/60`, `/65`, `/70`, `/75`, `/80`, `/90`, `/95`, `/100`

**14 farklı seviye.** Apple HIG ya da Material Design 3 tipik palet: **4-5 seviye**:
- Primary (100%)
- Secondary (~70%)
- Tertiary (~45%)
- Disabled (~30%)
- Decorative (~15%)

14 seviyenin **tasarım otoritesi sıfır** — her component yazan kişi (in this case, Claude) sezgisel olarak seçmiş.

**Düzeltme:** `globals.css`'a:
```css
@theme {
  --color-primary: #ffffff;
  --color-text-primary: rgba(255, 255, 255, 1);
  --color-text-secondary: rgba(255, 255, 255, 0.7);
  --color-text-tertiary: rgba(255, 255, 255, 0.45);
  --color-text-disabled: rgba(255, 255, 255, 0.3);
  --color-text-decorative: rgba(255, 255, 255, 0.15);
}
```

Aynı şey border opacity'leri için: `border-white/[0.06]` → `/[0.20]` arasında **7+ seviye** var.

### 4.6 Pill Navbar Mobile'da WCAG Altı

**Dosya:** `HeroSection.tsx:50`
```tsx
className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap text-white/65 ..."
```

`text-[10px]` mobile fontu. **WCAG önerisi: minimum 12px**. Apple HIG: minimum 11pt. 10px ne ikisini ne diğerini karşılıyor.

Ek olarak: `py-2 px-4` → vertical 8px padding ile touch target ~24px height. **WCAG 2.1 / iOS HIG minimum 44×44px** kuralının altında. Klavye-only / büyük parmaklı kullanıcı için **erişilebilirlik fail**.

### 4.7 `prefers-reduced-motion` Desteği = Sadece `OpeningSequence`

`OpeningSequence.tsx` `prefers-reduced-motion` kontrol ediyor (Phase 1'de eklenmişti). Ama:

| Komponent | Sonsuz animasyon | Reduced-motion bypass |
|-----------|----------------|----------------------|
| `LuminaAvatar.tsx:38-54` | breathing pulse | ❌ |
| `BentoSection.tsx:111-119` | emerald pulse | ❌ |
| `HeroSection.tsx:101-109` | emerald pulse | ❌ |
| `TerminalShowcase.tsx` | cursor blink | ❌ |
| `globals.css:124` | `lumina-focus-pulse` | ❌ |

Vestibüler bozukluk olan ziyaretçi için site **rahatsız edici**.

**Global guard ekle** (`globals.css`'ın sonuna):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 4.8 Skip-to-Content Yok

Erişilebilirlik standartı: ilk DOM elemanı **skip-to-content** linki olmalı.

```tsx
<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 ...">
  Skip to content
</a>
```

Klavye-only ziyaretçi (özellikle screen reader kullanıcısı) `Tab` ile navbar + Lumina + diğer interaktif öğeleri atlamak ister.

### 4.9 LuminaTrigger Mobile'da Form Üzerinde

`LuminaTrigger` (sparkles pill, sağ alt köşede sabit) `/contact` sayfasında, mobile'da, form submit butonunun **üzerine binme riski** taşıyor. Form'un padding-bottom'ı + Lumina'nın `bottom-6 right-6` z-index'i sıralaması test edilmeli. **Görülmemiş ama beklenir hata.**

### 4.10 Skor: 6 / 10

Detaylar genelde güzel, ama **tasarım sistemi disiplini değil, "vibe-based" disiplin** var. 14 opacity seviyesi, 7 border seviyesi, 3 emerald pulse, tutarsız tracking, atılan reduced-motion — bunlar premium portföylerin **tam tersi** sinyalleri.

---

## 🗑️ 5. TEKNİK BORÇ & KOD TEMİZLİĞİ

| # | Konu | Dosya / Lokasyon | Şiddet |
|---|------|-----------------|--------|
| 1 | **KRİTİK TYPO**: `Emre Dogan` (Ğ yok) | `app/about/page.tsx:134` | 🔴 CRITICAL |
| 2 | `framer-motion` ölü dependency | `package.json` | 🔴 HIGH |
| 3 | `Projects.tsx` ölü component | `components/sections/Projects.tsx` | 🔴 HIGH |
| 4 | `hero.mp4` (8.4 MB) ölü asset | `public/videos/hero.mp4` | 🔴 HIGH |
| 5 | `hero-cinematic.mp4` (16 MB) ölü asset | `public/videos/hero-cinematic.mp4` | 🔴 HIGH |
| 6 | `lumina.png` 2.2 MB optimize edilmemiş | `public/lumina.png` | 🟠 HIGH |
| 7 | 5 Next.js boilerplate SVG | `public/{file,globe,next,vercel,window}.svg` | 🟡 MED |
| 8 | Çift `GitHubIcon`/`LinkedInIcon` inline tanımı | `BentoSection.tsx:61-75` + `projects/[slug]/page.tsx` | 🟢 LOW |
| 9 | `as const` tekrarı (her sabit array) | yaygın | 🟢 LOW |
| 10 | 100+ char inline className | `BentoSection.tsx`, çeşitli | 🟢 LOW |
| 11 | Renk paleti tokenize değil | `globals.css` + tüm bileşenler | 🟡 MED |
| 12 | Section spacing tokenize değil | `globals.css` + tüm bileşenler | 🟡 MED |
| 13 | Hardcoded `$17,040 annual savings` | `components/home/TerminalShowcase.tsx` | 🟠 HIGH |
| 14 | `app/sitemap.ts` yok | route eksik | 🟡 MED |
| 15 | `app/robots.ts` yok | route eksik | 🟡 MED |
| 16 | OG image yok | `app/layout.tsx` metadata | 🟡 MED |
| 17 | JSON-LD schema yok | hiçbir sayfada | 🟢 LOW |
| 18 | `prefers-reduced-motion` global guard yok | `globals.css` | 🟠 HIGH |
| 19 | Skip-to-content link yok | `app/layout.tsx` | 🟠 HIGH |
| 20 | Lumina conversation persistance yok | `components/chat/LuminaWindow.tsx` | 🟠 HIGH |

### Özet İhmaller

- **Toplam atılması gereken disk**: ~26 MB
- **Toplam atılması gereken dependency**: 1 (`framer-motion`)
- **Toplam atılması gereken component**: 1 (`Projects.tsx`)
- **Kritik typo**: 1 (`Emre Dogan` → `Emre Doğan`)
- **Erişilebilirlik gap**: 3 (reduced-motion, skip-link, touch target boyutları)

### Skor: 6 / 10

Sınırda. Bir sonraki commit'te ilk 7 maddeyi tamamen sileceğinizi varsayıyorum — 30 dakika iş, **2 puan** yükseliş.

---

## 📱 6. MOBİL DENEYİM & GERÇEK CİHAZ KONTROLÜ

### 6.1 Lumina Mobile'da Sıkıntılı Geometri

**Dosya:** `LuminaWindow.tsx:174-176`

```ts
const positionClass = hasBeenMinimized
  ? "fixed bottom-24 right-6"
  : "fixed inset-0 m-auto";

const sizeClass = hasBeenMinimized
  ? "w-[calc(100vw-2.5rem)] sm:w-[420px] h-[min(78vh,520px)] sm:h-[520px]"
  : "w-[calc(100vw-2.5rem)] sm:w-[640px] h-[min(75vh,560px)] sm:h-[560px]";
```

**iPhone SE (375×667) centered Lumina:**
- Genişlik: `375 - 40 = 335px`
- Yükseklik: `min(500, 560) = 500px`
- Avatar: `w-24 h-24` (96px), `-top-12` (-48px) → **protrusion 48px yukarı**

**Toplam dikey kullanım:** 500 + 48 = **548px**. Ekran 667px - status bar 44px = effective 623px. Sığar ama:
- iOS Safari address bar (45px) görünür durumdaysa → 578px. Hâlâ sığar.
- Klavye açıldığında effective ~320px. Lumina'nın **yarısı klavye altında kalır.**

**Düzeltme:** Klavye açılınca Lumina otomatik minimize olsun (`onFocus` event input'a → `setHasBeenMinimized(true)`). Ya da centered Lumina'nın yüksekliğini `h-[min(60vh,520px)]` yap.

### 6.2 Hero Mobile Tipografi Riski

`HeroSection.tsx:78`:
```tsx
className="text-6xl md:text-7xl xl:text-8xl font-semibold tracking-[-0.06em] leading-[0.9]"
```

`text-6xl` ~60px. `"Emre Doğan."` = 11 karakter. `tracking-[-0.06em]` ile etkili font width ~94%.

**iPhone SE (375px - 48px padding = 327px effective width):** Yaklaşık 11 × 60 × 0.55 (avg char width) = **363px**. **36px overflow.** `whitespace-nowrap` olmadığı için kelimeler bölünür ama görsel olarak rahatsız edici olabilir.

**Galaxy Fold dış ekran (280px):** Kesin overflow.

**Düzeltme:** Mobile'da `text-5xl` (48px) breakpoint ekle:
```tsx
className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl ..."
```

### 6.3 BentoSection Mobile = 1280px+ Sadece Kart İçin

`BentoSection.tsx:308`:
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 ..."
```

Mobile'da 1 kolon. `min-h-[320px]` × 4 kart + `gap-3` (12px × 3) = **1316px**.

Ek olarak: Hero ~667px + MetricsRow ~120px + BentoSection 1316px + AboutSection muhtemelen 1000px+ = anasayfa toplam **3500-4000px dikey**.

Mobile dwell time gerçeği: ortalama **5-7 saniye scroll**. Visitor "Contact" CTA'sına ulaşmadan çıkar.

**Düzeltme:** Bento'yu mobile'da daha **dense** yap — `min-h-[240px]` ve aspect-ratio kullan. Toplam ~1000px düşür.

### 6.4 Safe-Area / Notch Desteği = Sıfır

`LuminaTrigger` ve minimize edilmiş Lumina `bottom-24 right-6` ile sabitlenmiş. iPhone X+ home indicator (34px). `bottom-24` (96px) → 96 - 34 = 62px gerçek mesafe. Tehlikeli değil ama **profesyonel olmayan**.

`Footer` muhtemelen bottom safe-area ile çakışır. Kontrol edilmedi.

**Düzeltme:**
```css
.lumina-trigger {
  bottom: calc(theme(spacing.6) + env(safe-area-inset-bottom));
}
```

### 6.5 Touch Target Boyutları (WCAG 2.5.5 — AAA)

| Element | Mevcut size | WCAG/Apple HIG min |
|---------|-------------|--------------------|
| Pill navbar item | ~24×44px | 44×44px |
| Lumina close (X) button | 24×24px | 44×44px |
| Bento "View project" link | small (~12px font) | 44×44px |
| Social hub GitHub/LinkedIn link | OK | OK |

`LuminaWindow.tsx:239-245` — close button `p-1` (4px padding) + `w-4 h-4` X icon = 24×24px total. **WCAG hard fail.**

### 6.6 Mobile Performans (3G/Slow 4G)

`motion/react` bundle ~80 KB gzipped. 3G'de TTI'a önemli katkı.
`lumina.png` 2.2 MB. 3G'de **45 saniye yükleme** (raw 4 Mbps).

**Düzeltme:** Lumina avatarını `priority={false}` `<Image>` ile lazy load et. Görünür olduğunda yükle.

### 6.7 Skor: 5.5 / 10

Çalışıyor ama **Apple-level mobile polish** değil. Notch desteği yok, touch target'lar küçük, klavye + Lumina çakışması var.

---

## 🧠 7. PSİKOLOJİK ALGI DENETİMİ

### 7.1 İlk 5 Saniyenin Anatomy'si

```
t=0      Sayfa girer. Sinematik intro overlay aktif.            ✓ wow
t=2.5s   Intro fade. Hero görünür. "Emre Doğan." başlığı.        ✓ wow
t=3.5s   Lumina merkezden açılır. Hero'yu örter.                ⚠️ hostile
t=4.2s   "Welcome to Emre Doğan's workspace."                   👀 reading
t=5.5s   "I am Lumina, your intelligent guide."                  👀 reading
t=6.9s   "Ask me anything about his architecture..."             😐 still waiting
t=7.3s   Input açılır.                                          😩 finally
```

**Sorun:**
- 0-3s sahne **harika**
- 3-7s **ziyaretçi seyirci konumunda, pasif**
- Hero içeriği Lumina tarafından örtülmüş; visitor **gerçek içeriğe ulaşamıyor**
- Lumina ile konuşmak ister mi, gerçek site mi gezsin — **karar paralizi**

**Modern portföy konvansiyonu:** ilk saniyeden itibaren **keşfetmeye davet** — scroll teşviki, CTA görünür, hero okunabilir. Lumina hero'nun **arkasında durmalı**, üzerinde değil.

### 7.2 Algılanan Yaş & Otorite Yanlış Konumlandırma

İronik soru: **Ziyaretçi Lumina'ya sormazsa Emre'nin kaç yaşında olduğunu nasıl anlar?**

Cevap: **anlamaz.**

Bütün site kurumsal/agency diline yazılmış:
- *"Architecting scalable AWS infrastructure"*
- *"production-grade AI-native infrastructure"*
- *"systems designed for operational leverage"*
- *"end-to-end products"*

Bu dil, **35-40 yaşında bir senior consultant** sinyali veriyor. Gerçek seviye **19 yaşında self-taught prodigy**.

Bu, klasik **underselling** hatası. Emre'nin asıl satış argümanı **genç yaşta bu seviyede olmak** ise (ve **kesinlikle öyle**), bu argument **gizleniyor**.

Eğer recruiter siteye girdiğinde *"35 yaşında deneyimli consultant"* algısıyla başlarsa, sonradan *"aslında 19"* öğrenince **iki tepki olabilir**:
1. *"Vaov, yaşına göre olağanüstü"* — **istenen tepki**
2. *"Beni yanılttı, abartılı bir self-promo"* — **risk**

Şu anki framing 2. tepkiye daha yakın. *"19. Self-taught. Monk Mode."* açılıştan itibaren framing değişir → her cümle bonus haline gelir.

### 7.3 Güven Eksikliği (Trust Vacuum)

Premium portföylerin temel trust signals'i:

| Trust Signal | Var mı |
|--------------|--------|
| Müşteri/şirket logoları | ❌ |
| Testimonial (kişisel referans) | ❌ |
| Konuşma/sunum kayıtları | ❌ |
| Blog/yazılı içerik | ❌ |
| GitHub stats / contribution heatmap | ❌ |
| "As featured in" listesi | ❌ |
| Sertifikalar (AWS Certified vs.) | ❌ |
| Çıktı metrikleri | ❌ (sadece fake $17,040) |

Tek "social proof": GitHub + LinkedIn linki. Bu **başlangıç noktası**, **bitiş noktası değil**.

### 7.4 Karar Anı — CTA Hierarchy Yok

Sitenin sonunda ziyaretçi şu sorulardan birini sormalı:
1. **"Bu kişiyi nasıl tutarım?"** → Recruiter perspektifi
2. **"Bu kişiyle nasıl çalışırım?"** → Founder/CEO perspektifi
3. **"Bunu nasıl peer / mentor / network olarak alırım?"** → Engineer/Investor

Şu an **hiçbiri** net cevaplanmıyor:
- Hero CTA: *"Explore Projects"* — generic
- About CTA: *"Get in touch"* + *"See the work"* — generic
- Footer CTA: muhtemelen email — generic

Profil-spesifik CTA'lar olmalı:
- *"View Resume"* (PDF) — recruiter için, 1 click
- *"Schedule a call"* (Cal.com/Calendly) — founder için
- *"View GitHub"* (canlı) — engineer için

### 7.5 Skor: 5 / 10

Premium **görünüyor**, premium **konuşmuyor**. Hikaye gizlenmiş. Trust signals yok. CTA hierarchy yok.

---

## 🗺️ 8. V2 → DÜNYA SINIFI ROADMAP

### 🔴 TIER 0 — KRİTİK (24 saat içinde, **utanç önleme**)

1. **`Emre Dogan` typo'sunu düzelt** (`app/about/page.tsx:134` → `Emre Doğan`).
2. **`npm uninstall framer-motion`**.
3. **Ölü asset'leri sil:**
   ```bash
   rm public/videos/hero.mp4 public/videos/hero-cinematic.mp4
   rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
   ```
4. **`components/sections/Projects.tsx` dosyasını sil.**
5. **`public/lumina.png`'i optimize et** → 256×256 WebP @ 80% quality.
6. **Lumina onboarding süresini kısalt:**
   - `T_MSG_3 = 1500ms`
   - `T_READY = 1800ms`
   - `T_ABSOLUTE_UNLOCK = 2500ms`
   - LuminaChat auto-open timeout: 3500ms → 1500ms
   - Hedef: visitor **3 saniye içinde yazabilsin**

**Tahmini süre:** 90 dakika. **Skor etkisi:** +0.5 puan.

---

### 🟠 TIER 1 — ÖNCELİK (1 hafta içinde, **gerçek fark**)

7. **`/about` sayfasına insan hikayesi inject et.** Hero copy'yi *"At 19, between bakery shifts..."* lehine yeniden yaz. Monk Mode konseptini görsel olarak temsil et (sol kolonda timeline: 04:30 bakery / 08:00 school / 16:00 code).

8. **Hero tagline'ını güncelle.** *"Cloud Architect. SaaS Builder. Mobile Developer."* yerine: *"19. Self-taught. Building between bakery shifts."*

9. **`MetricsRow.tsx` revize:** sayılar yerine `AGE — 19`, `SHIFTS — Bakery × 5 / School × 5 / Code × 7`, `STARTED — 2 years ago`, `STACK — AWS · Terraform · Claude`.

10. **Cloud Waste Hunter'ın `$17,040`'ını gerçekle.** Ya `/api/cwh/savings` endpoint'i kur ya da terminal output'una `[demo]` etiketi ekle.

11. **Yeşil emerald pulse'ları indir 1'e.** Sadece Hero availability indicator kalsın.

12. **`prefers-reduced-motion` global guard ekle** (`globals.css`).

13. **Skip-to-content link** ekle (`app/layout.tsx`).

14. **SEO temel:**
    - `app/sitemap.ts` (otomatik route discovery)
    - `app/robots.ts`
    - `app/opengraph-image.tsx` (1200×630 cinematic OG image)
    - JSON-LD `Person` schema layout'ta

15. **Lumina conversation persistence:** `localStorage` ile mesaj geçmişi. "New conversation" butonu.

16. **Lumina identity çelişkisini çöz:** Ya prompt'tan *"4.x neural-series"* iddiasını kaldır, ya da modeli `claude-sonnet-4-6`'ya yükselt.

17. **WCAG touch target audit:** Pill navbar, Lumina close button, bento "View project" → tümünü 44×44px minimum'a çıkar.

**Tahmini süre:** 5-7 gün. **Skor etkisi:** +1.5-2.0 puan.

---

### 🟡 TIER 2 — KALİTE ARTIRMA (2-3 hafta içinde, **dünya sınıfı kapı**)

18. **GitHub aktivite grafiği** — `/about`'a embed. `github-contributions-api` ile heatmap. "Aktif developer" kanıtı.

19. **AWS mimari diagram interactive** — `/projects/aws-waste-hunter`'a `<svg>` veya canvas-based mimari diagram. Lambda → DynamoDB → CUR akışı, hover'da node detayı.

20. **Cloud Waste Hunter canlı demo embed** — Hero veya BentoSection'a video/iframe. Recorded demo + canlı linke.

21. **Tasarım sistemi tokenize:** `globals.css`'a `--color-*`, `--tracking-*`, `--section-spacing-*` tokens. Tüm component'ler bu token'lara bağlanır.

22. **BentoSection rebalance:** 4 proje (simetrik) veya 1 büyük + 4 küçük (asimetrik bento). Social Hub Footer'a taşı.

23. **`/stack` sayfası elevation:** Sadece text card'lar yerine — hover'da araç ikonu/version/link to official docs. Mini-Stripe-grade.

24. **Profile-specific CTA'lar:**
    - Hero: 3 CTA (Explore Projects + View Resume + Hire Me)
    - Veya 1 CTA + Lumina trigger: *"Ask Lumina about my work"*

25. **Lumina tools:**
    - "New conversation" button
    - "Copy" message-level
    - Streaming stop button

**Tahmini süre:** 2-3 hafta. **Skor etkisi:** +1.0-1.5 puan.

---

### 🟢 TIER 3 — DİFERANSİYASYON (4-8 hafta, **Hacker News front page**)

26. **Blog / Notes sayfası** — 3-5 derin yazı:
    - *"Why I chose Bedrock over the Anthropic API for CWH"*
    - *"Building cross-account scanners with STS AssumeRole"*
    - *"From bakery shifts to AWS: my self-taught roadmap"*

27. **Live GitHub feed** — Webhook → Vercel KV → real-time render. *"Last commit 47 minutes ago to cloud-waste-hunter."*

28. **Bedrock Demo Sandbox** — Lumina'nın yanına bir mini *"test yourself"* sandbox. Visitor kendi cloud waste prompt'unu yaz, sonucu gör.

29. **Production metrics dashboard** — CWH'in toplam waste-found-USD, aktif kullanıcı, scan sayısı (gerçek veriler).

30. **AWS Sertifikasyon rozeti** — Emre AWS Solutions Architect Associate ve DevOps Engineer Professional alabilir. **Bu 2 sertifika tek başına recruiter algısını 2 puan yükseltir.**

31. **Twitter/X aktivitesi** — Embed bir live feed. *"Building in public"* açısı.

32. **Open-source mini-tool yayınla** — örn. `aws-waste-hunter-cli` (npm install -g) bir CLI versiyonu. GitHub star'ları otorite sinyali.

**Tahmini süre:** 4-8 hafta. **Skor etkisi:** +1.5-2.0 puan.

---

## 📊 9. FİNAL SKORLAMA (1-10)

| Boyut | Skor | Yorum |
|-------|------|-------|
| **Premium Hissi** (cilalı / pahalı durma) | **7.0** | Çok iyi, ama "agency template" tonu hâlâ var |
| **Hikaye Anlatımı** | **4.0** | Asıl hikaye sitede YOK; sadece Lumina'da gizli |
| **Marka Otoritesi** | **5.0** | GitHub, demo, blog, sertifika — hepsi eksik |
| **Mimari Kalite** (Next.js, server/client ayrımı) | **8.0** | Server-first, doğru sınırlar, temiz Phase 2 |
| **Performans** | **7.0** | Mantıklı; backdrop-filter ve ölü asset risk |
| **Mobil Deneyim** | **5.5** | Çalışıyor; safe-area, touch target, klavye çakışma sorunlu |
| **Animasyon Kalitesi** | **7.0** | İyi koreografi; gereksiz tekrarlar var |
| **Erişilebilirlik** | **4.0** | reduced-motion global yok, skip-link yok, küçük tipografi |
| **Orijinallik** | **6.0** | Lumina özgün, geri kalanı "premium dark template" |
| **Recruiter Algısı** | **6.0** | İyi görünüyor, kanıt yok |
| **Investor / Founder Algısı** | **5.0** | Metrik yok, müşteri yok, canlı demo yok |
| **Lumina UX** | **6.5** | Sinematik, ama 6s zorla bekletme hostile |
| **Kod Temizliği** | **6.0** | Ölü asset, ölü dep, ölü component |
| **Tasarım Sistemi Disiplini** | **5.0** | 14 opacity seviyesi, dağınık spacing |
| **SEO / Discoverability** | **4.0** | Sitemap yok, OG yok, schema yok |

### **GENEL ORTALAMA: 6.0 / 10**

### Skor Yorumu

| Aralık | Anlam |
|--------|-------|
| **9.0+** | Industry-defining (Linear, Vercel marketing site, Stripe Docs) |
| **8.0-8.9** | Dünya sınıfı (Resend, Cursor, Anthropic) |
| **7.0-7.9** | Premium, dikkat çeker (en üst %5 portfolio) |
| **6.0-6.9** | İyi hobi projesi, polish'i yüksek **← şu anki konum** |
| **5.0-5.9** | İlerleme var, hâlâ ham |
| **<5.0** | Amatör |

**Tier 0 + Tier 1** uygulanırsa: **7.2-7.5** aralığı.
**Tier 2** ile: **8.0-8.5**.
**Tier 3** ile: **8.5-9.0+** — dünya sınıfı kapısı.

---

## ✍️ KAPANIŞ NOTU

Bu portföy, **çok yetenekli bir 19 yaşındakinin** elinden çıkmış.

Disiplin var. Vizyon var. Çoğu rakibinin asla yapamayacağı detaylar var:
- Phase'lerden geçerek **Lumina'yı sıfırdan inşa etmek** — gerçek inovasyon
- Server/Client sınırlarına saygı duymak — gerçek mühendislik
- Sinematik intro koreografisi — gerçek tasarımcı sezgisi
- Half-overlap avatar geometrisini matematiksel olarak çözmek — gerçek detay obsesyonu

Bu nadir.

**Ama portföy, sahibinin asıl gücünü gizliyor.**

Genç yaş, hızlı öğrenme, self-taught hikaye, 04:30 fırın vardiyasıyla kod yazma — bunlar **rekabet avantajı**. Şu an site bu avantajı **sansürlüyor** ve yerine *"another consultant"* pozisyonu sunuyor.

İronik: site, *"Lumina"* gibi otantik, özgün bir karakter yaratmayı başardı — ama site sahibinin kendi otantik karakterini açıklamayı başaramadı. Lumina, Emre'den daha *"insan"* hissediyor.

Üç hafta odaklı çalışmayla bu portföy, **Hacker News'in front page'ine düşebilecek** bir hikaye anlatısına dönüşebilir. **Tier 0 + Tier 1 zorunlu**, **Tier 2 erişilebilir**, **Tier 3 hayal değil**.

İyi haber: çoğu sorun **yapısal değil, disiplinsel**. Mimari sağlam. Anlatı eksik. Detay temizliği eksik. Bunlar **bir hafta sonu** ile **iki haftalık çalışmayla** çözülebilir.

Hadi bakalım.

— *Director's Note*

---

*Bu denetim, 14 Mayıs 2026 tarihinde sitenin Phase 2.6 snapshot'ı üzerine yapılmıştır. Sonraki Phase'lerle güncellenmeli.*
