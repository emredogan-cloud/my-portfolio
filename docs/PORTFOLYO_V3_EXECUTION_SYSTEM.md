# PORTFÖY V3 — EXECUTION SYSTEM

> **Tür:** Operasyonel Engineering Playbook (elite internal sprint doc)
> **Tarih:** 14 Mayıs 2026
> **Versiyon:** 1.0
> **Hedef:** Tek bir Claude CLI agent'in, bu dokümanı açıp, V3 dönüşümünü minimum insan müdahalesi ile execute etmesi.
> **Önceki dokümanlar:** [PORTFOLYO_V2_DENETIM.md](./PORTFOLYO_V2_DENETIM.md) (audit), [PORTFOLYO_V3_ROADMAP.md](./PORTFOLYO_V3_ROADMAP.md) (strategy)

---

## 📋 0. KULLANIM TALİMATI

Bu doküman 4 phase içerir. Her phase **deployable milestone** — kendi başına ship edilir, sonraki phase üzerine inşa eder.

### 0.1 Sıralama Kuralı

**Phase'leri ASLA paralel execute etme.** Her phase önceki phase'in production'da kararlı çalışmasını varsayar. Tipik sıra:

```
Phase 1 → deploy → 1 hafta production observation → Phase 2 → deploy → 2 hafta observation → Phase 3 → ...
```

Production observation = canlı trafik üzerinde regression yok, Lumina çalışıyor, Lighthouse skoru hedefin üzerinde.

### 0.2 Agent İşletim Modu

Her phase'in başında:
1. **Bu dokümanı tamamen oku.**
2. **İlgili phase'in "AI Agent Execution Prompt" bölümünü oku.**
3. **Prompt'taki Pre-Scan'i atla.** Her zaman çalıştır.
4. **Adımları sırasıyla execute et.** Atlama yok, kısayol yok.
5. **Her step sonrası checkpoint commit.** Phase sonunda squash YOK.

### 0.3 İptal / Geri Alma Hakkı

Agent herhangi bir noktada:
- Performance budget'i aşarsa → **DUR**, root cause bul
- Lighthouse skoru düşerse → **DUR**, regression fix et
- Build error verirse → **DUR**, fix sonrası devam
- Lumina UX bozulursa → **DUR ve geri al**

"Devam et" kararı her zaman explicit olmalı, otomatik değil.

### 0.4 Tek Cümlede Misyon

> Mevcut portföyü **kırmadan**, **yavaşlatmadan**, **görsel kimliğini değiştirmeden**, agile sıralı 4 phase üzerinden **founder platformuna** dönüştür.

---

## 🧠 1. EXECUTION FELSEFESİ

Agent her phase'de bu prensiplere göre davranır. **Bu prensipler her phase'e aktarılır** ve phase prompt'larında tekrarlanır.

### 1.1 Agent Düşünce Sırası

```
1. Mevcut kod ne yapıyor?       (Read + Grep)
2. Mevcut sistem yeterli mi?    (Decision)
3. Genişletme mi, yenisi mi?    (Default: GENİŞLET)
4. En küçük değişiklik ne?      (Surgical edit)
5. Bu phase'in scope'unda mı?   (Anti-creep gate)
6. Implement.
7. Verify (build + lighthouse + manual).
8. Commit.
```

**Default: extend, do not rewrite.** Agent, yeni bir component yazmaktan önce, mevcut bir component'i prop ile genişletmeyi denemeli.

### 1.2 Refactor Agresifliği

| Phase | İzin Verilen Refactor Seviyesi |
|-------|-------------------------------|
| 1 | **Yok.** Sadece foundation/SEO/a11y ekle. Var olan kodu DEĞİŞTİRME. |
| 2 | **Surgical.** Lumina'ya tool use ekle, ama mevcut UI bozulmasın. Yeni feature'lar = yeni dosyalar. |
| 3 | **Moderate.** Voice mode için Lumina chat akışı değişebilir, ama API contract korunur. |
| 4 | **Mature.** Stabil pattern'ler reusable utility'lere çıkarılabilir (örn. `lumina-chat` npm). |

### 1.3 Yeni Soyutlama Kuralları

Yeni bir component / hook / utility yaratma kararı **2 koşul**:
1. Aynı pattern **3+ yerde** tekrar ediyor olmalı.
2. Pattern'in karmaşıklığı inline okumayı zorlaştırıyor olmalı.

Aksi takdirde **inline kal**. Premature abstraction = code rot başlangıcı.

### 1.4 Yeniden Kullanım Kuralları

Yeni bir şey eklerken **önce** ara:

| İhtiyaç | Önce Kontrol |
|---------|--------------|
| Yeni renk | `globals.css` tokens (primary/secondary/tertiary/quiet/faint) |
| Yeni animasyon ease | `motion/react` constants (`[0.22, 1, 0.36, 1]` mevcut) |
| Yeni reveal pattern | `components/ui/Reveal.tsx` mevcut |
| Yeni button stili | `glass-panel` veya beyaz CTA mevcut |
| Yeni icon | `lucide-react` (her zaman İLK önce) |
| Yeni Lumina action | Mevcut `useChat` API üzerinden ekle |

### 1.5 Sinematik Kimlik Koruması (KIRILMAZ KURAL)

Bu öğeler **asla değişmez** — değiştirme talebi gelse bile:

- 🎨 **Cyan #00d2ff** = tek accent. Yeni renk YOK.
- 🔤 **Geist** = tek font. Yeni font YOK.
- 🌌 **Lumina avatar geometrisi** (half-overlap, glow halkaları)
- 🎬 **Cinematic intro koreografisi** (timing değiştirme)
- 📐 **Bento asimetrik 2×2+1+1 layout** (Phase 4'e kadar koru)
- ⚫ **`bg-black`** ana background
- 🎵 **`Geist` `font-medium tracking-[-0.04em]` H1 stilizasyonu**

Bu liste **non-negotiable**. Refactor, yeni feature, "iyileştirme" — hiçbir gerekçe bu listenin değişimini meşrulaştırmaz.

### 1.6 Feature Bloat'tan Kaçınma

**Her yeni özelliğin cevap vermek zorunda olduğu üç soru:**

1. **Bu özellik ne çıkarıyor?** (Eklemek = aynı zamanda çıkarmak)
2. **Bu özellik visitor'ın kalış süresini artırıyor mu, dağıtıyor mu?**
3. **Bu özellik sökülmeden 6 ay sonra hala değerli olacak mı?**

Üç soru cevaplanmıyorsa → **ekleme**. Roadmap'te olsa bile.

---

## ⚙️ 2. GLOBAL MÜHENDİSLİK KURALLARI

Bu kurallar **tüm phase'lerde** geçerlidir. Phase prompt'ları bu kuralları otomatik kabul eder, tekrarlamaz.

### 2.1 Bağımlılık Disiplini

- ❌ Yeni `npm install X` **gerekçesiz yapılmaz**. Her install öncesi:
  - Bundle size impact'i ölç (`npm i X && npm run build`'den önce/sonra bundle delta)
  - Aynı işi mevcut bir paket yapıyor mu? (kontrol et)
  - Production-ready mi? (>10K weekly downloads, son güncelleme <6 ay)
  - License uygun mu? (MIT/Apache/BSD)
- ✅ Bundle delta > 30KB gzipped ise **gerekçe yaz**.
- ❌ Dev dependency olabilecek bir paket runtime dep olarak yüklenmez.

### 2.2 Mevcut Kod Önce Aranır

- ❌ Yeni utility yazmadan önce `grep`/`Read` ile mevcut benzer fonksiyonları ara.
- ❌ Yeni component yazmadan önce `components/ui/`, `components/sections/`, `components/layout/` taraması yap.
- ❌ Yeni hook yazmadan önce — bekle, custom hook YAZMA. Önce inline çöz. 3 yerde tekrar ediyorsa hook'a çıkar.

### 2.3 Animasyon Sistemi

- ✅ **Tek animasyon engine'i:** `motion/react`. Başka hiçbir animation lib yok.
- ❌ CSS `animation` keyframes — sadece `globals.css`'de tanımlı olanlar (`grain-fade-in`, `terminal-cursor-blink`, `lumina-focus-pulse`). Yenileri eklenmez.
- ❌ Aynı viewport'ta ≥ 3 sonsuz animasyon — visual overload.
- ✅ Tüm sonsuz animasyonlar `@media (prefers-reduced-motion: reduce)` ile devre dışı bırakılabilmeli.
- ✅ Animasyon süreleri:
  - UI feedback (hover, focus): ≤ 200ms
  - Page transition / reveal: 400-700ms
  - Decorative loops: ≥ 2s (slow, ambient)

### 2.4 Performance Bütçesi

| Metrik | Hedef | Hard Limit |
|--------|-------|-----------|
| LCP (mid-Android, 4G) | < 1.8s | < 2.5s |
| FID | < 50ms | < 100ms |
| CLS | < 0.02 | < 0.1 |
| Lighthouse Mobile | ≥ 95 | ≥ 90 |
| Lighthouse Desktop | ≥ 98 | ≥ 95 |
| Initial JS bundle (gzip) | < 180KB | < 250KB |
| Largest route JS | < 300KB | < 400KB |
| Animation frame budget | < 16ms | < 33ms |

**Hard limit'i aşan PR merge edilmez.** Phase deploy edilmez.

### 2.5 Server-First Architecture

- ✅ Default: Server Component.
- ✅ `"use client"` **eklenir, dosyaya gerekçe yazılır** (üst yorum satırında).
- ✅ Client islands `_components/` altında (Next.js convention).
- ❌ Server Component'te `useState`/`useEffect`/`onClick` — derleme hatası alır, devam etme.
- ❌ Tüm page client component yapma. Page = Server Component; interaktiflik = ada.

### 2.6 Hydration Güvenliği

- ✅ Server ve ilk client render **byte-byte aynı HTML üretmeli**.
- ❌ `Date.now()`, `Math.random()`, `Date.toLocaleString()` (locale-dependent) — render sırasında **kullanılmaz**.
- ✅ Time-dependent UI: önce skeleton, mount sonrası gerçek değer.
- ✅ User-dependent UI (cookie, localStorage): `useEffect` ile mount sonrası hydrate.

### 2.7 Design Token Kullanımı

- ❌ Inline `text-white/65`, `text-white/40` — **yasak** (V2 token migration sonrası).
- ✅ Token kullan: `text-primary`, `text-secondary`, `text-tertiary`, `text-quiet`, `text-faint`.
- ❌ Inline `rgba(...)` — sadece atmosfer gradient'larında (radial-gradient layers).
- ❌ Magic hex code — sadece `#00d2ff` (Lumina cyan) inline OK, başka renk yok.

### 2.8 Glassmorphism Disiplini

- ✅ Tek viewport'ta **max 1 `backdrop-filter` katmanı**.
- ✅ Var olan `.liquid-glass` ve `.glass-panel` utility'leri yeterli; yeni varyant ekleme.
- ❌ Lumina overlay'inde backdrop-filter — Phase 2.4'te kaldırıldı, **geri ekleme**.

### 2.9 Mobile-First Performans

- ✅ Her phase deploy öncesi mobile emulation (DevTools "Pixel 5") + 4G throttle ile test.
- ✅ Touch target ≥ 44×44px.
- ✅ Safe-area inset (notch) ile çakışma yok.
- ✅ Klavye açıldığında layout dağılmaz.

### 2.10 SEO Korunumu

- ✅ Her route `generateMetadata` veya static `metadata` export'una sahip.
- ✅ Her image `alt` attribute'a sahip (decorative ise `alt=""`).
- ✅ Heading hierarchy: bir `<h1>` per route, sıralı `<h2>`, `<h3>`...
- ❌ `<div>` ile semantic role taklit etme.

### 2.11 Erişilebilirlik Korunumu

- ✅ Tüm interactive elementler keyboard-navigable.
- ✅ Focus ring görünür (Tailwind `focus:ring-...` veya custom).
- ✅ `prefers-reduced-motion` global guard her phase'de aktif.
- ✅ Skip-to-content link (Phase 1'de eklenmeli).
- ✅ ARIA labels icon-only butonlarda zorunlu.

### 2.12 Generic SaaS UI Cliché Yasakları

Bu pattern'ler **eklenmez**:

- ❌ Site-wide cursor spotlight effect
- ❌ Tilt cards (Apple Music vinyl)
- ❌ Parallax scrolling on hero
- ❌ Particles.js generic background
- ❌ Animated number counters (corporate dashboard hissi)
- ❌ Spinning 3D object as decoration
- ❌ Gradient borders ("magic UI" tarzı)
- ❌ Auto-playing video
- ❌ Confetti effects
- ❌ Theatrical loading screens > 1s

---

## 🏗️ 3. PHASE MİMARİSİ

4 phase, sıralı, her biri **deployable milestone**.

```
Phase 1 ─── Foundation Hardening      (30 gün)  ─── Toplam: 8-12 commit
   ↓
Phase 2 ─── Authority Infrastructure  (90 gün)  ─── Toplam: 20-30 commit
   ↓
Phase 3 ─── Founder Ecosystem         (180 gün) ─── Toplam: 30-50 commit
   ↓
Phase 4 ─── Recognition Layer         (365 gün) ─── Toplam: 50-100 commit
```

### 3.1 PHASE 1 — FOUNDATION HARDENING

**Süre:** 30 gün
**Tipi:** Polish + infrastructure (no flashy new features)

#### Objective
Mevcut sistemin **temellerini sertleştir**: SEO, a11y, PWA, performance cache, Lumina'nın production-readiness'i. Yeni feature YOK. Yeni component YOK (sadece minimal infra component'leri).

#### Etkilenen Sistemler
- `app/globals.css` — reduced-motion guard
- `app/layout.tsx` — skip-link, JSON-LD, manifest
- `app/sitemap.ts` (yeni)
- `app/robots.ts` (yeni)
- `app/opengraph-image.tsx` (yeni)
- `app/manifest.ts` (yeni)
- `app/api/github-feed/route.ts` (yeni)
- `app/api/chat/route.ts` — edge runtime
- `components/chat/LuminaWindow.tsx` — localStorage persistence
- `components/home/LiveGitHubFeed.tsx` — use new API endpoint
- `components/sections/HeroSection.tsx` — pill navbar touch target
- `components/chat/LuminaWindow.tsx` — close button touch target
- `components/sections/BentoSection.tsx` — View project link touch target

#### Dependencies
- `@vercel/kv` (yeni) — KV cache
- `@vercel/og` (yeni) — dynamic OG images
- Mevcut `next/font`, `motion/react`, `react-markdown` — değişmez

#### Risk Analizi

| Risk | Olasılık | Şiddet | Mitigasyon |
|------|----------|--------|------------|
| `prefers-reduced-motion` global guard Lumina avatar pulse'ını kırar | Düşük | Orta | Test: emulate → Lumina hala kullanılabilir mi? |
| Edge runtime Anthropic SDK ile çakışır | Düşük | Yüksek | SDK v3+ Edge'i destekliyor; sandbox'ta test et |
| Vercel KV provisioning eksik | Orta | Düşük | KV instance'ı önceden hazırla |
| Skip-link cinematic intro'yu bozar | Düşük | Düşük | sr-only sınıfı focus dışında görünmez |
| Touch target değişimleri layout shift'e neden olur | Orta | Düşük | CLS metric'i kontrol et |

#### Başarı Kriterleri
- ✅ Lighthouse Mobile ≥ 95 (her route)
- ✅ Lighthouse PWA ≥ 95
- ✅ All 18 routes still build
- ✅ Lumina conversation persists across page reload
- ✅ GitHub feed survives 100+ visits without rate limit
- ✅ TTFB on /api/chat improved (target: <120ms warm, <300ms cold)
- ✅ Reduced-motion emulation: zero infinite animations active
- ✅ Tab key → skip-link first, semantic flow second

#### Performance Constraints
- LCP +0 ms (foundation work zorlu metric'leri etkilememeli)
- CLS < 0.02 (touch target değişiklikleri layout shift yapmaz)
- Initial JS bundle delta < 15KB gzipped

#### Mobile Constraints
- Lighthouse Mobile her route'ta 95+
- iOS Safari "Add to Home Screen" çalışır
- Status bar styling doğru (manifest)

#### SEO Constraints
- `/sitemap.xml` 200, geçerli XML
- `/robots.txt` 200, geçerli format
- Her route OG image render eder
- JSON-LD Person schema valid (https://validator.schema.org/)

#### Accessibility Constraints
- WCAG AA compliant (WAVE extension veya axe-core ile audit)
- Tüm touch target ≥ 44×44px
- Skip-link visible on Tab
- `prefers-reduced-motion: reduce` ile sayfada zero inf animasyon

#### Git Stratejisi
- **Branch:** `feat/v3-phase1-foundation`
- **Commit per step** — agent her step'ten sonra commit eder
- **Commit prefix:** `phase1: ...`
- **Final commit:** `phase1: complete — foundation hardened`
- **Final PR:** "Phase 1 — Foundation Hardening" başlığıyla `main`'e merge

#### Test Checklist
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — 18+ routes green
- [ ] Lighthouse `/` mobile ≥ 95
- [ ] Lighthouse `/about` mobile ≥ 95
- [ ] Lighthouse `/notes` mobile ≥ 95
- [ ] Lighthouse `/notes/monk-mode` mobile ≥ 95
- [ ] DevTools "Emulate reduced motion" → tüm pulse animasyonları durmuş
- [ ] Tab key → skip link odaklanıyor
- [ ] iOS Safari → "Add to Home" prompts
- [ ] `/sitemap.xml` → 200
- [ ] `/robots.txt` → 200
- [ ] Lumina aç → mesaj at → sayfa reload → mesaj hala görünüyor
- [ ] `/api/github-feed` → 200 (KV cache miss → hit)

#### Rollback Planı
Her step'in atomic commit'i var. Sorun çıkarsa:
```bash
git revert <step-commit>
git push
```
Vercel otomatik geri deploy eder.

Daha kötü senaryo (multiple step bozuk):
```bash
git reset --hard <last-known-good-commit>
git push --force origin feat/v3-phase1-foundation
```

---

### 3.2 PHASE 2 — AUTHORITY INFRASTRUCTURE

**Süre:** 90 gün
**Tipi:** Authority signals + Lumina V2 (memory + tools)

#### Objective
Visitor'a **somut kanıt** sun: live GitHub aktivitesi (var), 3D AWS topology (yeni), CWH demo sandbox (yeni), Lumina tools (yeni). Visitor "bu kişi sadece yazmıyor, **inşa ediyor**" hissini almalı.

#### Etkilenen Sistemler
- `app/projects/[slug]/_components/AWSTopologyScene.tsx` (yeni — Three.js)
- `app/projects/[slug]/_components/CWHSandbox.tsx` (yeni — Bedrock streaming)
- `app/api/cwh-demo/route.ts` (yeni — Bedrock proxy)
- `components/home/LiveGitHubFeed.tsx` — Build Beacon variant + KV-aware
- `app/api/github-webhook/route.ts` (yeni — push event → KV update)
- `lib/lumina/tools.ts` (yeni — Claude tool_use schema)
- `lib/lumina/memory.ts` (yeni — Upstash Vector or KV-based session memory)
- `components/chat/LuminaWindow.tsx` — tool-use rendering, memory hydration
- `app/api/chat/route.ts` — tool dispatch, memory load/save
- `lib/lumina/system-prompt.ts` — time-of-day persona

#### Dependencies
- `three` + `@react-three/fiber` + `@react-three/drei` (yeni)
- `@upstash/vector` veya `@upstash/redis` (memory için)
- `@anthropic-ai/sdk` (zaten var, Bedrock için ayrı confg)
- AWS SDK for Bedrock (proxy endpoint için)

#### Risk Analizi

| Risk | Olasılık | Şiddet | Mitigasyon |
|------|----------|--------|------------|
| Three.js bundle bloat (+200KB) | Yüksek | Orta | Dynamic import + Suspense + 2D fallback |
| Bedrock streaming latency (>3s) | Orta | Yüksek | Edge runtime + Bedrock Claude Haiku |
| Lumina tool use halüsinasyonu | Orta | Orta | JSON schema validation + tool registry whitelist |
| Memory leak (session not cleaned) | Düşük | Yüksek | TTL: 7 gün KV expire |
| GitHub webhook security (HMAC) | Yüksek | Yüksek | HMAC SHA-256 validation in webhook route |
| 3D scene mobile performance < 30fps | Yüksek | Orta | Mobile detection → 2D fallback render |

#### Başarı Kriterleri
- ✅ 3D AWS Topology Explorer çalışıyor desktop'ta 60fps
- ✅ Mobile'de 2D fallback render, smooth
- ✅ CWH Sandbox: visitor IAM policy paste → 4s içinde streaming response
- ✅ Build Beacon: gerçek commit time → 30dk içinde "Currently shipping" pulse
- ✅ Lumina memory: 7 gün öncesinin konuşması hatırlanır
- ✅ Lumina tool use: "Son commit ne?" sorusu doğru cevaplanır
- ✅ Bundle: tüm route'larda < 250KB initial JS

#### Performance Constraints
- /projects/aws-waste-hunter LCP < 2.5s (3D scene yüklenirken)
- Lumina tool response: < 1.2s total roundtrip (tool call + Claude response)
- Build Beacon: zero added blocking time (uses cached KV)
- CWH Sandbox: streaming first token < 1s

#### Mobile Constraints
- 3D scene'de mobile fallback aktif (otomatik detection)
- CWH Sandbox bottom-sheet style on mobile
- Touch targets korunur

#### SEO Constraints
- Tüm yeni route'lar generateMetadata
- 3D scene canvas'ı SEO-invisible — alt content metin olarak da var
- robots.txt'ye yeni endpoint'ler eklenir (no-index API routes)

#### Accessibility Constraints
- 3D scene: keyboard navigation (arrow keys → rotate)
- CWH Sandbox: textarea label, screen reader hint
- Lumina tools: tool execution status announced via aria-live

#### Git Stratejisi
- **Branch:** `feat/v3-phase2-authority`
- **Step başına PR:** Phase 2 büyük, sub-PR yaklaşımı:
  - PR1: 3D AWS Topology
  - PR2: CWH Sandbox + Bedrock proxy
  - PR3: Build Beacon + GitHub webhook
  - PR4: Lumina V2 (memory + tools)
- **Her PR independent deployable** — yarısı deploy edilebilir kalır.

#### Test Checklist
- [ ] 3D scene desktop: rotate, zoom, hover, click → tüm interaktif
- [ ] 3D scene mobile: 2D fallback render, smooth scroll
- [ ] 3D scene reduced-motion: rotation durur, static layout
- [ ] CWH Sandbox: 3 farklı IAM policy ile streaming test
- [ ] CWH Sandbox rate limit: 6. istek → 429
- [ ] Build Beacon: GitHub'a commit at → 60s içinde "Currently shipping"
- [ ] Lumina memory: 2 oturum → 2. oturumda 1. oturumun referansı
- [ ] Lumina tool: "Son commit ne?" → doğru repo + message
- [ ] Lumina tool: "Cloud Waste Hunter ne yapıyor?" → data/projects.ts'den detay
- [ ] Lighthouse Mobile /projects/aws-waste-hunter ≥ 90

#### Rollback Planı
Sub-PR yaklaşımı sayesinde tek bir feature problemliyse o PR revert edilir, diğerleri çalışmaya devam eder.

---

### 3.3 PHASE 3 — FOUNDER ECOSYSTEM

**Süre:** 180 gün
**Tipi:** Voice Lumina + Public CWH Pro Launch + Architecture storytelling

#### Objective
Visitor "bu kişiyi takip etmem lazım" hissini şu üç şeyle al:
1. **Voice Lumina** — mic button, gerçek konuşma
2. **CWH Pro public launch** — pricing UI, ilk paying customer
3. **/architecture page** — Apple-product-style scroll storytelling

#### Etkilenen Sistemler
- `components/chat/LuminaVoice.tsx` (yeni)
- `app/api/voice/transcribe/route.ts` (yeni — Whisper)
- `app/api/voice/tts/route.ts` (yeni — ElevenLabs streaming)
- `app/architecture/page.tsx` (yeni — scroll storytelling)
- `app/architecture/_components/ScrollStory.tsx` (yeni)
- `app/projects/[slug]/_components/ProductionMetrics.tsx` — gerçek data integration
- `app/(marketing)/cwh/page.tsx` veya `app/pro/page.tsx` (yeni — pricing)
- `app/api/cwh/metrics/route.ts` (yeni — gerçek DynamoDB query)

#### Dependencies
- ElevenLabs SDK
- OpenAI SDK (Whisper) veya alternative open-source
- Stripe veya Lemon Squeezy SDK (CWH Pro billing)
- AWS SDK (gerçek CWH metrics için)

#### Risk Analizi

| Risk | Olasılık | Şiddet | Mitigasyon |
|------|----------|--------|------------|
| Voice latency > 1.5s (cold start) | Orta | Yüksek | Edge + connection pooling + warm starts |
| Browser mic permission UX kötü | Yüksek | Orta | İlk hover'da tutorial, açıklama |
| Stripe vs Lemon Squeezy karar paralizi | Yüksek | Düşük | Lemon Squeezy seç (Phase 2'de zaten yorumda var) |
| /architecture scroll perf düşük | Orta | Orta | Intersection Observer + lazy scene loads |
| CWH live metrics endpoint exposed sensitive data | Düşük | Yüksek | Aggregation only, no per-user data |

#### Başarı Kriterleri
- ✅ Voice mode: ilk audio token < 800ms
- ✅ Voice mode: cevap streaming smooth (no gaps)
- ✅ /architecture: 5 scroll milestone tamamı animate ediyor
- ✅ CWH Pro pricing: visitor checkout flow tamamlıyor (test mode)
- ✅ ProductionMetrics: artık mock değil, KV'den live data
- ✅ İlk paying customer'dan sonra Live Customer Counter footer'a entegre

#### Performance Constraints
- Voice end-to-end (user speaks → Lumina responds with audio) < 3s
- /architecture LCP < 2s (lazy 3D scenes)
- /pro pricing page LCP < 1.5s (static + minimal islands)

#### Mobile Constraints
- Voice mode mobile-friendly (büyük mic button, klavye kapatır)
- /architecture scroll storytelling mobile portrait optimize
- Pricing page mobile checkout flow test edilmiş

#### Git Stratejisi
- **Branch:** `feat/v3-phase3-ecosystem`
- **Sub-PR:**
  - PR1: Voice Lumina
  - PR2: /architecture page + scroll story
  - PR3: CWH Pro public launch + pricing
  - PR4: Live metrics integration

---

### 3.4 PHASE 4 — RECOGNITION LAYER

**Süre:** 365 gün (sürekli)
**Tipi:** Sürekli iyileştirme + endüstri tanınırlığı

#### Objective
Platform şu kanıtları **otomatik üretir**:
- Live Customer Counter (CWH gerçek paying user)
- AI-generated Daily Standup (auto-tweet)
- Reverse Engineering Bento
- Open-source npm package (`lumina-chat`)
- Conference talk submissions

#### Etkilenen Sistemler
- `components/layout/Footer.tsx` — Live Customer Counter
- `app/api/auto-tweet/route.ts` (yeni — cron-triggered)
- `components/sections/BentoSection.tsx` — Reverse Engineering hover state
- `packages/lumina-chat/` (yeni monorepo workspace)
- `app/manifest.ts` — PWA optimization for app-store-grade

#### Dependencies
- Twitter API v2 (auto-tweet)
- npm publish workflow
- Vercel cron jobs

---

## 🤖 4. AI AGENT EXECUTION PROMPTS

Bu bölüm her phase için **copy-paste ready** prompt içerir. Agent başlayacağı zaman ilgili prompt'u açar, içeriği kopyalar, yapıştırır.

Her prompt **self-contained**: önceki conversation'a bağlı değil, sıfırdan başlatılabilir.

---

### 4.1 PHASE 1 PROMPT — Foundation Hardening

```
==============================================
PHASE 1 — FOUNDATION HARDENING
Hedef Süre: 1-2 hafta
Risk Seviyesi: DÜŞÜK
==============================================

## A. PRE-SCAN (ZORUNLU — atlama YOK)

Aşağıdaki adımları SIRAYLA yürüt. Her adımdan sonra
ne öğrendiğini tek cümlede özetle:

1. Read PORTFOLYO_V3_EXECUTION_SYSTEM.md tamamen — özellikle
   "Cinematic Identity Protection" ve "Global Engineering Rules".

2. Read app/globals.css — mevcut tokens (primary/secondary/
   tertiary/quiet/faint), `@plugin "@tailwindcss/typography"`,
   ve mevcut `@keyframes` listesi.

3. Read app/layout.tsx — root yapı, geist font setup,
   Analytics yerleşimi, OpeningSequence + LuminaChat sırası.

4. Read components/cinematic/OpeningSequence.tsx —
   `prefers-reduced-motion: reduce` mevcut handling.

5. Grep -rn "prefers-reduced-motion" --include="*.tsx"
   --include="*.css" --include="*.ts" .
   Bekleniyor: SADECE OpeningSequence.tsx eşleşmesi.

6. Read components/chat/LuminaWindow.tsx — useChat hook,
   sequence timing, message rendering, Copy button logic.
   Lumina SACRED — bu phase'de UI'sına dokunma.

7. Read components/home/LiveGitHubFeed.tsx — mevcut fetch
   logic (`api.github.com/users/.../events/public`).

8. Read package.json — mevcut dep list.

9. Bash: `npm run build` — baseline build green confirm.
10. Bash: `git status` — clean tree confirm.

PRE-SCAN ÇIKTI ÖRNEK:
"Codebase 19 route, Server-first, Lumina cyan #00d2ff, token
system aktif (primary/secondary/...), reduced-motion sadece
intro'da, build green, GitHub feed direct API çağrısı."

## B. IMPLEMENTATION PLAN

Adımları SIRAYLA yürüt. Her adım sonrası:
- Build green confirm: `npm run build`
- Checkpoint commit: `git add . && git commit -m "phase1: <step>"`

### STEP 1: Global prefers-reduced-motion guard

app/globals.css'in en SONUNA ekle (Lumina input keyframes'in
sonrasında):

```css
/* ─────────────────────────────────────────────────────────────
   Global reduced-motion guard. Vestibular bozukluğu olan
   ziyaretçi için tüm sonsuz animasyonları neredeyse durdur.
   Phase 1 — Foundation Hardening.
   ───────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Test:
- DevTools → Rendering → Emulate CSS prefers-reduced-motion: reduce
- Reload — tüm pulse animasyonları neredeyse durmuş olmalı
- Lumina hala kullanılabilir mi? — EVET olmalı

Commit: `phase1: add global prefers-reduced-motion guard`

### STEP 2: Skip-to-content link

app/layout.tsx body içindeki ilk eleman olarak (GlobalGrain'in üstüne):

```tsx
<a
  href="#main"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-full focus:font-medium focus:text-sm"
>
  Skip to content
</a>
```

app/page.tsx, app/about/page.tsx, app/notes/page.tsx, app/stack/page.tsx,
app/projects/page.tsx, app/contact/page.tsx — her sayfadaki <main> elementine
`id="main"` ekle.

Test:
- Browser'da Tab tuşuna bas (ilk yüklemede)
- Skip link odaklanmalı, görünür olmalı

Commit: `phase1: add skip-to-content link for keyboard navigation`

### STEP 3: Touch target audit

Files to fix (her biri ayrı edit):

(a) components/sections/HeroSection.tsx — pill navbar link:
Eski:
```
className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap text-secondary hover:text-primary transition-colors duration-200"
```
Yeni: aynı className + `inline-flex items-center min-h-[44px] px-2`

(b) components/chat/LuminaWindow.tsx — close button (X):
Eski:
```
className="text-white/40 hover:text-white/85 transition-colors duration-200 p-1 rounded"
```
Yeni: `p-2.5` (10px padding → toplam 36px; OK if w-4 + 20px = 44px)

(c) components/chat/LuminaWindow.tsx — New Conversation button (RotateCcw):
Aynı padding güncellemesi.

(d) components/sections/BentoSection.tsx — "View project" link:
Mevcut `text-xs sm:text-sm` çok küçük. Touch hedef için padding:
`py-3 -my-1` ekle (vertical hit area expand).

Test:
- DevTools mobile emulation (Pixel 5)
- Tüm interactive elementler tap edilebilir hissi vermeli
- Lighthouse mobile → "Tap targets are sized appropriately" 100

Commit: `phase1: enforce 44px touch targets across nav, lumina header, bento`

### STEP 4: SEO foundation

(a) Create app/sitemap.ts:
```ts
import type { MetadataRoute } from "next";
import { projectsData } from "@/data/projects";
import { notesData } from "@/data/notes";

const SITE_URL = "https://emredogan.com"; // veya gerçek domain

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/about", "/projects", "/stack", "/notes", "/contact"];
  const projectRoutes = projectsData.map((p) => `/projects/${p.id}`);
  const noteRoutes = notesData.map((n) => `/notes/${n.slug}`);

  return [...routes, ...projectRoutes, ...noteRoutes].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1.0 : 0.7,
  }));
}
```

(b) Create app/robots.ts:
```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: "https://emredogan.com/sitemap.xml",
  };
}
```

(c) Create app/opengraph-image.tsx (1200×630):
Vercel OG ile cinematic OG image — Geist tipografi, cyan accent, "Emre Doğan — 19. Self-taught. Monk Mode."

(d) app/layout.tsx içine JSON-LD Person schema ekle:
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Emre Doğan",
      jobTitle: "Cloud & SaaS Engineer",
      url: "https://emredogan.com",
      sameAs: [
        "https://github.com/emredogan-cloud",
        "https://www.linkedin.com/in/emre-do%C4%9Fan-657a99388/",
      ],
    }),
  }}
/>
```

Test:
- visit `/sitemap.xml` — 200, valid XML
- visit `/robots.txt` — 200
- Twitter Card Validator + Facebook Sharing Debugger — OG image render

Commit: `phase1: add sitemap, robots, dynamic OG, JSON-LD person schema`

### STEP 5: PWA manifest

Create app/manifest.ts:
```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Emre Doğan",
    short_name: "ED.",
    description: "Cloud & SaaS Engineer — Monk Mode operator",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#00d2ff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
```

icon-192.png ve icon-512.png üret (Vercel OG ile veya manuel):
- Background: #000
- Foreground: "ED." in Geist, cyan glow
- Save to /public/icon-192.png, /public/icon-512.png

Test:
- Chrome DevTools → Application → Manifest section → "Installable" tick
- iOS Safari → Share → Add to Home Screen → icon ve splash doğru

Commit: `phase1: add PWA manifest and home-screen icons`

### STEP 6: Vercel KV cache for GitHub feed

Önce KV instance setup (Vercel dashboard üzerinden):
- Vercel project → Storage → KV → Create
- `KV_REST_API_URL` ve `KV_REST_API_TOKEN` env vars'a otomatik eklenir

Install:
```
npm install @vercel/kv
```

Create app/api/github-feed/route.ts:
```ts
import { kv } from "@vercel/kv";

export const runtime = "edge";

const CACHE_KEY = "gh-feed:emredogan-cloud";
const TTL_SECONDS = 3600;

export async function GET() {
  try {
    const cached = await kv.get(CACHE_KEY);
    if (cached) {
      return Response.json(cached, {
        headers: { "x-cache": "hit" },
      });
    }
    const res = await fetch(
      "https://api.github.com/users/emredogan-cloud/events/public",
      { headers: { "User-Agent": "emredogan.com portfolio" } },
    );
    if (!res.ok) throw new Error(`gh status ${res.status}`);
    const data = await res.json();
    await kv.set(CACHE_KEY, data, { ex: TTL_SECONDS });
    return Response.json(data, { headers: { "x-cache": "miss" } });
  } catch (err) {
    return Response.json(
      { error: "unavailable" },
      { status: 503 },
    );
  }
}
```

Update components/home/LiveGitHubFeed.tsx:
Fetch URL'i `/api/github-feed` olarak değiştir. Hata handling aynı kalır.

Test:
- İlk istek: `curl http://localhost:3000/api/github-feed -I` → `x-cache: miss`
- 2. istek: `x-cache: hit`
- 100 ardışık istek: hala miss olmamalı (cache hit oranı %99+)

Commit: `phase1: introduce edge KV cache for GitHub events feed`

### STEP 7: Lumina edge runtime

Edit app/api/chat/route.ts — ilk satıra ekle:

```ts
export const runtime = "edge";
```

Edge runtime'da `@ai-sdk/anthropic` SDK çalışıyor olmalı (v3+).
Eğer çalışmıyorsa: SDK'yi güncel tut, edge-compatible import et.

Test:
- `npm run dev` → /api/chat'e POST at → cevap dönmeli
- Vercel preview deploy → TTFB ölç (eski Node.js runtime'a göre 2-4x daha hızlı)

Commit: `phase1: move Lumina chat endpoint to edge runtime`

### STEP 8: Lumina conversation persistence

components/chat/LuminaWindow.tsx içinde:

(a) İmportlara ekle:
```ts
import { useEffect } from "react";
```
(zaten var, tekrar ekleme)

(b) `const { messages, setMessages, ... } = useChat();` altına state hydration:
```ts
const STORAGE_KEY = "lumina-conversation-v1";

useEffect(() => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed);
      }
    }
  } catch {
    /* ignore */
  }
}, [setMessages]);

useEffect(() => {
  if (messages.length === 0) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* ignore */
  }
}, [messages]);
```

(c) handleNewConversation güncelle:
```ts
const handleNewConversation = () => {
  setMessages([]);
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  inputRef.current?.focus();
};
```

(d) Welcome sequence guard:
Eğer sessionStorage'da mesajlar varsa, welcome sequence'i atla.
Mevcut `sequenceFiredRef` zaten bunu yapıyor — ama hydration order kontrol et.

Test:
- Lumina aç → 3 mesaj at
- Sayfa yenile (F5)
- Lumina aç → 3 mesaj hala görünmeli
- "New Conversation" → mesajlar gitmeli
- Yenile → boş kalmalı

Commit: `phase1: persist Lumina conversations across reloads via sessionStorage`

## C. QUALITY CONTROL

Phase 1 step'leri tamamlandıktan sonra ve final commit öncesi:

(a) Build green confirm:
```
npx tsc --noEmit
npm run build
```
Beklenen: zero errors, 18+ route generated.

(b) Lighthouse audit (her route):
- /
- /about
- /notes
- /notes/monk-mode
- /projects/aws-waste-hunter
- /stack

Hedef: her route Mobile ≥ 95.

(c) Erişilebilirlik audit:
- axe DevTools veya WAVE extension
- Hata sıfır olmalı

(d) Reduced motion test:
- DevTools "Emulate reduced-motion: reduce"
- Sayfayı tara — zero sonsuz animasyon
- Lumina aç → avatar pulse durmuş, ama kullanılabilir

(e) Mobile manual test (DevTools Pixel 5):
- Tüm tap target'lar tappable
- Lumina mobile'da kullanılabilir
- Klavye + Lumina çakışmıyor

## D. GIT DİSİPLİNİ

Branch yaratıldı: `feat/v3-phase1-foundation`

Step başına commit:
- `phase1: add global prefers-reduced-motion guard`
- `phase1: add skip-to-content link for keyboard navigation`
- `phase1: enforce 44px touch targets across nav, lumina, bento`
- `phase1: add sitemap, robots, dynamic OG, JSON-LD person schema`
- `phase1: add PWA manifest and home-screen icons`
- `phase1: introduce edge KV cache for GitHub events feed`
- `phase1: move Lumina chat endpoint to edge runtime`
- `phase1: persist Lumina conversations across reloads`

Her commit:
- Conventional başlık
- Body (2-4 satır): WHY açıklaması
- Co-Authored-By trailer

Final:
- `phase1: complete — foundation hardened`

Push:
```
git push -u origin feat/v3-phase1-foundation
```

GitHub'da PR aç: title "Phase 1 — Foundation Hardening".
Body: bu prompt'un başlık + step başına 1-line summary.

Merge stratejisi: **squash merge YAPMA**. Per-step commit history korunur.

## E. FINAL VALIDATION

Production-readiness checklist (PR merge öncesi):

- [ ] `npx tsc --noEmit` — zero error
- [ ] `npm run build` — 18+ route green
- [ ] Lighthouse Mobile / ≥ 95
- [ ] Lighthouse Mobile /about ≥ 95
- [ ] Lighthouse Mobile /notes/monk-mode ≥ 95
- [ ] Lighthouse PWA ≥ 95
- [ ] axe-core a11y → zero critical issues
- [ ] DevTools reduced-motion → tüm sonsuz animasyonlar durmuş
- [ ] Tab tuşu → skip-link odaklanır
- [ ] /sitemap.xml → 200, valid XML
- [ ] /robots.txt → 200
- [ ] OG image render (Twitter / Facebook validator)
- [ ] iOS Safari "Add to Home" → çalışır
- [ ] Lumina → mesaj at → sayfa yenile → mesaj görünür
- [ ] /api/github-feed → KV cache hit oranı %99+
- [ ] /api/chat → edge runtime confirmed (response header check)
- [ ] Ölü kod kontrolü: `grep -r "TODO\|FIXME\|XXX" app components | wc -l` baseline'dan büyük değil

Code cleanliness:
- [ ] Hiçbir `console.log` yok production code'unda
- [ ] Hiçbir kullanılmayan import yok
- [ ] Dead code yok (eklediğin code commented-out kalmamış)

Önceki phase'le çakışma yok:
- [ ] Lumina UI değişmedi (sadece persistence eklendi)
- [ ] Cinematic intro değişmedi
- [ ] Token system bozulmadı (text-secondary, text-tertiary hala çalışıyor)
- [ ] Bento layout aynı

PR merge → deploy → production smoke test → Phase 1 closed.

==============================================
PHASE 1 SON.
==============================================
```

---

### 4.2 PHASE 2 PROMPT — Authority Infrastructure

```
==============================================
PHASE 2 — AUTHORITY INFRASTRUCTURE
Hedef Süre: 6-12 hafta
Risk Seviyesi: ORTA-YÜKSEK
==============================================

ÖN KOŞUL: Phase 1 deploy edilmiş, 1 hafta production observation,
zero regression. Aksi takdirde Phase 2'ye GEÇMA.

## A. PRE-SCAN (ZORUNLU)

1. Read PORTFOLYO_V3_EXECUTION_SYSTEM.md — özellikle "Phase 2"
   bölümü ve Anti-Patterns.

2. Read PORTFOLYO_V3_ROADMAP.md — Section 3 (Deep Tech) ve
   Section 4 (Lumina V3) için context.

3. Confirm Phase 1 deployed:
   - `git log --oneline -20 | grep phase1`
   - Vercel deployment status → live
   - Lighthouse mobile / ≥ 95 hala geçerli

4. Read all Lumina files:
   - components/chat/LuminaWindow.tsx
   - components/chat/LuminaChat.tsx
   - components/chat/LuminaAvatar.tsx
   - components/chat/LuminaTrigger.tsx
   - lib/lumina/system-prompt.ts
   - app/api/chat/route.ts

5. Read data/projects.ts, data/notes.ts — Lumina tool use için
   bunlardan veri çekecek.

6. Bash: `npm ls three @react-three/fiber 2>&1` — confirm not installed.

7. Vercel Environment Variables check:
   - KV_REST_API_URL ✓ (Phase 1)
   - KV_REST_API_TOKEN ✓ (Phase 1)
   - ANTHROPIC_API_KEY ✓
   - GITHUB_WEBHOOK_SECRET (yeni — Phase 2'de eklenecek)
   - AWS_BEDROCK_ACCESS_KEY (yeni — Phase 2'de)
   - AWS_BEDROCK_SECRET_KEY (yeni — Phase 2'de)

8. Bash: `git status` clean → `git checkout -b feat/v3-phase2-authority`

## B. IMPLEMENTATION PLAN

Phase 2 ÇOK büyük — 4 sub-PR ile parçala. Her sub-PR independent
deployable.

### SUB-PR 1: 3D AWS Topology Explorer (1-2 hafta)

Dosyalar:
- app/projects/[slug]/_components/AWSTopologyScene.tsx (yeni)
- app/projects/[slug]/_components/TopologyMobileFallback.tsx (yeni)
- app/projects/[slug]/page.tsx (update — conditional render)

Adımlar:

1. Install:
```
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

Bundle delta hedefi: < 200KB gzipped (dynamic import ile).

2. AWSTopologyScene.tsx — Three.js scene:
- 12 node (Lambda, API Gateway, DynamoDB, S3, Bedrock, Glue, Athena,
  SQS, EventBridge, Cognito, CloudFront, CWH)
- Edge'ler service-to-service çağrılar
- Cyan tonlarında gradient
- Idle'da autorotate 0.001 radyan/frame
- Hover → tooltip with config snippet
- Click → modal Terraform snippet
- `<Suspense>` fallback: minimal skeleton

3. TopologyMobileFallback.tsx — 2D react-flow veya custom SVG:
- Aynı 12 node, force-directed layout
- Mobile-optimized interactions
- No 3D library, küçük bundle

4. Conditional render in page.tsx:
```tsx
import dynamic from "next/dynamic";
const AWSTopologyScene = dynamic(
  () => import("./_components/AWSTopologyScene"),
  { ssr: false, loading: () => <SkeletonScene /> }
);
```

Mobile detection (window.innerWidth < 768 veya
`navigator.hardwareConcurrency <= 4`):
- Mobile → render TopologyMobileFallback
- Desktop → render AWSTopologyScene

5. Conditional rendering only for /projects/aws-waste-hunter:
```tsx
{slug === "aws-waste-hunter" && <AWSTopologyExplorer />}
```

Test:
- Desktop: 60fps, rotate smooth
- Mobile: 2D fallback render, smooth
- Reduced-motion: rotation duruyor
- Mobile Lighthouse /projects/aws-waste-hunter ≥ 90
- Bundle: 3D scene chunk lazy-loaded (network tab confirm)

Commit ladder:
- `phase2: install three.js for AWS topology scene`
- `phase2: add 3D AWSTopologyScene with 12 service nodes`
- `phase2: add 2D mobile fallback for topology`
- `phase2: wire conditional topology render to CWH project`

PR1 sonu: `phase2: ship 3D AWS topology explorer (sub-pr 1)`

### SUB-PR 2: CWH Demo Sandbox + Bedrock proxy (2-3 hafta)

Dosyalar:
- app/projects/[slug]/_components/CWHSandbox.tsx (yeni)
- app/api/cwh-demo/route.ts (yeni — Bedrock proxy)
- lib/bedrock-client.ts (yeni)

Adımlar:

1. AWS Bedrock setup:
- AWS Console → IAM → create user with `bedrock:InvokeModelWithResponseStream`
- Vercel env vars: AWS_BEDROCK_ACCESS_KEY, AWS_BEDROCK_SECRET_KEY

2. Install:
```
npm install @aws-sdk/client-bedrock-runtime
```

3. lib/bedrock-client.ts — minimal wrapper:
```ts
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

export function getBedrockClient() {
  return new BedrockRuntimeClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_BEDROCK_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_BEDROCK_SECRET_KEY!,
    },
  });
}
```

4. app/api/cwh-demo/route.ts:
- Edge runtime
- Rate limit: 5 req per IP per hour (Vercel KV)
- Input: { policyJson: string }
- Output: streaming text response from Claude Haiku via Bedrock
- System prompt: "Analyze this AWS IAM policy. Return specific issues + remediation."

5. CWHSandbox.tsx:
- Textarea (pre-filled with over-permissive admin policy)
- "Analyze" button
- Streaming response display
- Loading state
- Error state (rate limit, network)

6. Inject into /projects/aws-waste-hunter page:
- Below ProductionMetrics (which is mock)
- Above Detailed description

Test:
- Paste policy → streaming response < 4s
- Rate limit: 6. istek → 429
- Mobile bottom-sheet style adjust
- Reduced-motion: streaming dots animasyonu durmuş

Commit ladder:
- `phase2: install AWS Bedrock SDK`
- `phase2: add Bedrock client wrapper`
- `phase2: add /api/cwh-demo edge route with rate limit`
- `phase2: add CWHSandbox interactive widget`
- `phase2: integrate sandbox into CWH project page`

PR2 sonu: `phase2: ship Cloud Waste Hunter inline demo sandbox (sub-pr 2)`

### SUB-PR 3: Build Status Live Beacon (1 hafta)

Dosyalar:
- app/api/github-webhook/route.ts (yeni)
- components/layout/BuildBeacon.tsx (yeni)
- components/layout/Footer.tsx (update — render BuildBeacon)

Adımlar:

1. GitHub webhook setup:
- GitHub repo settings → webhooks → add
- URL: https://emredogan.com/api/github-webhook
- Content type: application/json
- Secret: oluştur, Vercel env'ye ekle (GITHUB_WEBHOOK_SECRET)
- Events: push

2. app/api/github-webhook/route.ts:
- Edge runtime
- HMAC SHA-256 validation (X-Hub-Signature-256 header)
- On push event: update KV:
  - `last_commit_at` = timestamp
  - `last_commit_repo` = repo name
  - `last_commit_message` = head_commit.message

3. components/layout/BuildBeacon.tsx (Client Component):
- Mount'ta GET /api/build-status (yeni endpoint, KV'den oku)
- 60s interval ile re-fetch
- Display:
  - Last commit < 30 min → cyan pulse + "Currently shipping"
  - 30 min - 4h → solid cyan + "Recently shipped"
  - > 4h → solid gray + "Resting"

4. Footer.tsx → BuildBeacon ekle (signature line yanına subtle):
```tsx
<BuildBeacon />
```

Test:
- Real commit at → 60s içinde "Currently shipping" pulse
- 30 min sonra → "Recently shipped"
- HMAC fail → 401 from webhook endpoint
- Reduced-motion → pulse duruyor

Commit ladder:
- `phase2: add github push webhook with hmac validation`
- `phase2: add build status KV read endpoint`
- `phase2: add BuildBeacon footer component`
- `phase2: wire BuildBeacon into footer`

PR3 sonu: `phase2: ship live build status beacon (sub-pr 3)`

### SUB-PR 4: Lumina V2 — memory + tools (2-3 hafta)

Dosyalar:
- lib/lumina/tools.ts (yeni)
- lib/lumina/memory.ts (yeni)
- app/api/chat/route.ts (update — tool dispatch + memory)
- components/chat/LuminaWindow.tsx (update — tool call rendering)
- lib/lumina/system-prompt.ts (update — tool descriptions + time-of-day persona)

Adımlar:

1. lib/lumina/tools.ts — tool registry:
```ts
export const LUMINA_TOOLS = [
  {
    name: "getProjectDetails",
    description: "...",
    input_schema: { ... }
  },
  {
    name: "searchNotes",
    ...
  },
  {
    name: "getRecentCommits",
    ...
  },
  // ...
];

export async function executeTool(name: string, input: object) {
  // dispatch
}
```

2. lib/lumina/memory.ts — Upstash Vector veya KV (basit MVP için KV):
- Session ID = anonymous UUID (localStorage)
- Mesajları KV'ye yaz, 7 gün TTL
- Yeni session'da load et

3. app/api/chat/route.ts güncelle:
- tool_use loop:
  - Claude'a tools listesi gönder
  - Tool call gelirse executeTool() çağır
  - Sonucu Claude'a geri ver, devam et
- Memory hydration: session_id varsa önceki mesajları yükle

4. LuminaWindow.tsx:
- localStorage'dan session_id read/write
- Tool call status rendering ("Lumina is checking GitHub..." gibi)

5. system-prompt.ts:
- Time-of-day awareness:
  ```
  Current time at Emre's location: ${formattedTime}
  - 01:30 - 08:00 → "Emre is currently at the bakery."
  - 08:00 - 16:00 → "Emre is at school."
  - 16:00 - 22:00 → "Emre is in the build window."
  - 22:00 - 01:30 → "Emre is sleeping."
  ```
- Tool descriptions (Claude'a hangi tool ne işe yarar)

Test:
- "Cloud Waste Hunter ne yapıyor?" → tool getProjectDetails() çağrı + cevap
- "Son commit ne?" → tool getRecentCommits() çağrı + repo + message
- 2 farklı session: 2. session'da 1. session referansı
- Tool latency < 1.2s

Commit ladder:
- `phase2: add lumina tool registry with JSON schemas`
- `phase2: add KV-backed conversation memory`
- `phase2: implement tool_use loop in chat route`
- `phase2: render tool call status in lumina window`
- `phase2: add time-of-day persona to lumina system prompt`

PR4 sonu: `phase2: ship lumina v2 with memory and tool use (sub-pr 4)`

## C. QUALITY CONTROL

Sub-PR başına QC ayrı çalışır. Phase final QC tüm sub-PR'ler
merge edildikten sonra.

Phase 2 final QC checklist:

(a) Build green tüm yeni route'larla:
```
npm run build
```
Beklenen: 21+ route (18 Phase 1 + yeni API endpoints).

(b) Bundle audit:
```
npm run build
```
- /projects/aws-waste-hunter chunk: Three.js lazy load, initial < 250KB
- Tüm route'larda Phase 1'e göre +50KB max delta

(c) Lighthouse audit (her route):
- /projects/aws-waste-hunter Mobile ≥ 90 (3D scene yüzünden hafif düşüş OK)
- Diğer route'lar ≥ 95 hala geçerli

(d) Manual smoke tests:
- 3D scene desktop rotate
- 3D scene mobile fallback
- CWH Sandbox: paste IAM policy → streaming response
- BuildBeacon: gerçek commit at, 60s içinde pulse
- Lumina memory: 2 session
- Lumina tool: "Son commit ne?"

## D. GIT DİSİPLİNİ

Branch: `feat/v3-phase2-authority`

Sub-PR yaklaşımı:
- PR1: feat/v3-phase2-authority → main (3D topology)
- PR2: feat/v3-phase2-authority → main (CWH Sandbox)
- PR3: feat/v3-phase2-authority → main (Build Beacon)
- PR4: feat/v3-phase2-authority → main (Lumina V2)

Her sub-PR independent merge. Her sub-PR sonrası deploy + observation.

## E. FINAL VALIDATION

Phase 2 cumulative checklist (tüm sub-PR'ler merge edildikten sonra):

- [ ] 3D AWS Topology — desktop 60fps, mobile fallback, reduced-motion OK
- [ ] CWH Sandbox — streaming response < 4s, rate limit working
- [ ] Build Beacon — gerçek commit ile pulse
- [ ] Lumina memory — cross-session continuity
- [ ] Lumina tools — getProjectDetails, getRecentCommits işliyor
- [ ] Time-of-day persona — saatlere göre selamlama değişiyor
- [ ] Lighthouse Mobile ≥ 90 her route
- [ ] PR2 (CWH Sandbox) için: rate limit gerçek test edildi
- [ ] HMAC validation gerçek webhook ile test edildi
- [ ] AWS Bedrock cost monitoring set up (CloudWatch alarm)
- [ ] Tool use halüsinasyon: 20 farklı soru → 0 false fact

Phase 2 closed.

==============================================
PHASE 2 SON.
==============================================
```

---

### 4.3 PHASE 3 PROMPT — Founder Ecosystem

```
==============================================
PHASE 3 — FOUNDER ECOSYSTEM
Hedef Süre: 12-24 hafta (3-6 ay)
Risk Seviyesi: YÜKSEK (Voice + Live billing)
==============================================

ÖN KOŞUL: Phase 2 deployed, 2 hafta production observation,
Lumina V2 stabile çalışıyor, Bedrock cost makul.

## A. PRE-SCAN

1. Read PORTFOLYO_V3_EXECUTION_SYSTEM.md Phase 3 bölümü.
2. Read PORTFOLYO_V3_ROADMAP.md Section 4 (Lumina V3), Section 6 (Monetization).
3. Confirm Phase 2 deployed + stable:
   - Lumina memory işliyor (test conversation)
   - 3D topology cinsiyetli render
   - CWH Sandbox kullanıma açık
4. Confirm financial constraints:
   - Lemon Squeezy account ready (CWH billing için)
   - ElevenLabs API key & quota
   - OpenAI Whisper API key & quota
5. Environment vars (Vercel):
   - LEMON_SQUEEZY_API_KEY (yeni)
   - LEMON_SQUEEZY_STORE_ID (yeni)
   - LEMON_SQUEEZY_WEBHOOK_SECRET (yeni)
   - ELEVENLABS_API_KEY (yeni)
   - OPENAI_API_KEY (Whisper için, yeni)

## B. IMPLEMENTATION PLAN

3 sub-PR:

### SUB-PR 1: Voice Lumina (3-4 hafta)

Dosyalar:
- app/api/voice/transcribe/route.ts (yeni — Whisper)
- app/api/voice/tts/route.ts (yeni — ElevenLabs streaming)
- components/chat/LuminaVoice.tsx (yeni)
- components/chat/LuminaWindow.tsx (update — mic button)

Adımlar:

1. /api/voice/transcribe edge endpoint:
- Accept audio blob (WebM Opus)
- Forward to OpenAI Whisper API
- Return transcribed text

2. /api/voice/tts edge endpoint:
- Accept text
- Stream from ElevenLabs (PCM streaming)
- Voice: cyan-toned, choice TBD (test "Adam" or "Rachel")

3. LuminaVoice.tsx:
- Mic button (next to Send button)
- MediaRecorder API to record audio
- On stop: POST to /api/voice/transcribe
- Use transcript as Lumina input
- On Lumina response: stream to /api/voice/tts, play audio chunks

4. UX states:
- Idle (mic icon)
- Recording (pulsing red)
- Transcribing (spinner)
- Lumina thinking (current onboarding indicator)
- Lumina speaking (waveform display)

Test:
- End-to-end voice: "Hi Lumina" → transcript → Lumina response → audio
- Latency: first audio token < 800ms
- Mobile mic permission flow
- Reduced-motion: waveform durmuş

Commits:
- `phase3: add Whisper transcription endpoint`
- `phase3: add ElevenLabs TTS streaming endpoint`
- `phase3: add LuminaVoice client component`
- `phase3: integrate voice mode into Lumina window`

### SUB-PR 2: /architecture page — Apple-style scroll storytelling (3-4 hafta)

Dosyalar:
- app/architecture/page.tsx (yeni)
- app/architecture/layout.tsx (yeni)
- app/architecture/_components/ScrollStory.tsx (yeni)
- app/architecture/_components/StoryMilestone.tsx (yeni)

Adımlar:

1. Define 8 scroll milestones (CWH architecture story):
1. "Visitor signs up via Cognito" (signup UI illustration)
2. "Connects AWS account via STS AssumeRole" (animated trust diagram)
3. "Lambda scanner triggers" (animated lambda execution)
4. "Multi-region fan-out via ThreadPool" (parallel arrows)
5. "Findings stored in DynamoDB" (table populate animation)
6. "Bedrock generates remediation" (Claude streaming)
7. "User sees dashboard" (UI mockup)
8. "Recurring scans via EventBridge" (cycle diagram)

2. ScrollStory.tsx — IntersectionObserver-based reveal:
- Sticky h1 ile başlık
- Her milestone scroll'a göre fade in/out
- Background gradient transitions per milestone (cyan → purple → green)

3. Mobile: scroll-snap milestones, swipe through

Commits:
- `phase3: scaffold /architecture route`
- `phase3: add ScrollStory engine with intersection observer`
- `phase3: write 8 CWH architecture milestones`
- `phase3: mobile-optimize architecture scroll`

### SUB-PR 3: CWH Pro public launch + pricing + live metrics (4-6 hafta)

Dosyalar:
- app/pro/page.tsx (yeni — pricing page)
- app/api/checkout/route.ts (yeni — Lemon Squeezy)
- app/api/lemon-webhook/route.ts (yeni — Lemon Squeezy webhook)
- app/api/cwh/live-metrics/route.ts (yeni — gerçek CWH metrics)
- app/projects/[slug]/_components/ProductionMetrics.tsx (update — gerçek data)
- components/layout/LiveCustomerCounter.tsx (yeni — Footer entegrasyon)

Adımlar:

1. Lemon Squeezy setup:
- 3-tier pricing: Free, Plus ($99/mo), Pro ($299/mo)
- Checkout URL'leri al, env'ye yaz

2. /pro page — pricing UI:
- 3 column comparison
- Feature checklists
- Checkout button → Lemon Squeezy
- Live customer count: "Trusted by 47 cloud engineers"

3. Lemon Squeezy webhook:
- subscription_created → KV `cwh_paying_customers` increment
- subscription_cancelled → decrement

4. /api/cwh/live-metrics (read-only from KV):
- total_savings_usd
- active_scanners
- lambda_invocations_30d
- paying_customers

5. ProductionMetrics.tsx — gerçek data fetch (artık mock değil):
- "Live data integration pending" → "Live data" pill
- Number animation on initial reveal

6. LiveCustomerCounter — Footer integration:
- "Currently helping X engineers" pulsing cyan
- Only renders if paying_customers > 0

Commits:
- `phase3: scaffold /pro pricing page`
- `phase3: add Lemon Squeezy checkout endpoint`
- `phase3: add Lemon Squeezy webhook with KV state`
- `phase3: live metrics endpoint reading from KV`
- `phase3: replace mock CWH metrics with live data`
- `phase3: add live customer counter to footer`

## C. QC

Phase 3 cumulative QC:
- Voice mode end-to-end < 3s
- /architecture scroll mobile smooth
- Checkout flow (test mode) → KV state update
- ProductionMetrics: gerçek sayılar
- Lighthouse her route ≥ 90 (voice/3D routes hafif düşüş OK)

## D. GIT

Branch: `feat/v3-phase3-ecosystem`
3 sub-PR. Voice ilk, architecture sonra, CWH Pro son.

## E. FINAL VALIDATION

- [ ] Voice mode: viral-able mı? — kendin test et + 3 arkadaş test
- [ ] /architecture: 5 dakika dwell time elde ediliyor mu?
- [ ] CWH Pro: ilk paying customer (test mode → live mode)
- [ ] Live metrics: gerçek sayılar
- [ ] Footer counter: "Currently helping X engineers" → X > 0

Phase 3 closed.

==============================================
PHASE 3 SON.
==============================================
```

---

### 4.4 PHASE 4 PROMPT — Recognition Layer

```
==============================================
PHASE 4 — RECOGNITION LAYER
Hedef Süre: Sürekli (12 ay+)
Risk Seviyesi: ORTA (mature systems)
==============================================

ÖN KOŞUL: Phase 3 deployed, CWH Pro'da ilk 5 paying customer,
voice mode kullanıma açık.

## A. PRE-SCAN

1. Read full execution system.
2. Confirm Phase 3 stable, CWH Pro revenue tracked.
3. Twitter API access (eğer auto-tweet hedefliyorsa).

## B. IMPLEMENTATION PLAN

4 sub-PR (long-running):

### SUB-PR 1: AI-Generated Daily Standup (auto-tweet) (1 hafta)

Dosyalar:
- app/api/auto-tweet/route.ts (yeni — Vercel Cron)
- vercel.json — cron schedule
- lib/twitter-client.ts (yeni)

Logic:
- Cron her gün 09:00 GMT+3 trigger
- Linear/Notion API'sinden günün plan'ı çek
- Claude'a inject → tweet draft üret
- Twitter API'sine post

Commits:
- `phase4: add twitter client wrapper`
- `phase4: add daily standup auto-tweet cron endpoint`
- `phase4: wire vercel cron to auto-tweet`

### SUB-PR 2: Reverse Engineering Bento (1 hafta)

components/sections/BentoSection.tsx update:
- Hover state — kart "decompose" animasyonu (Three.js layer)
- CWH card: hover → arkadan Lambda/DynamoDB/Bedrock node'lar belirir
- 3-4 saniye sonra tekrar toparlanır

Performance check: animasyon idle CPU < 5%.

Commits:
- `phase4: add bento decompose hover state for CWH card`
- `phase4: optimize bento animation idle cost`

### SUB-PR 3: Open-source `lumina-chat` npm package (2-3 hafta)

Yapı:
- packages/lumina-chat/ (yeni workspace)
- npm publish workflow (GitHub Actions)

Package shape:
```
@emredogan/lumina-chat
├── src/
│   ├── LuminaChat.tsx
│   ├── LuminaWindow.tsx
│   ├── LuminaAvatar.tsx
│   └── ...
├── README.md (premium)
├── package.json
└── tsconfig.json
```

Premium README example, with badges, demo gif, install instructions, customization.

Commits:
- `phase4: scaffold lumina-chat npm package workspace`
- `phase4: extract Lumina components into reusable package`
- `phase4: write premium README with demo`
- `phase4: add GitHub Actions npm publish workflow`

### SUB-PR 4: Mobile PWA optimization complete (1-2 hafta)

- Lighthouse Mobile target ≥ 98
- Haptic feedback all touch points
- Safe-area perfect
- Add-to-home flow polished
- Splash screen optimized

Commits:
- `phase4: add haptic feedback to all touch interactions`
- `phase4: enforce safe-area-inset across UI`
- `phase4: polish PWA splash screen`
- `phase4: achieve Lighthouse Mobile 98+`

## C. QC

- Auto-tweet: 7 gün gerçek tweet'ler
- Bento decompose: animasyon CPU < 5% idle
- npm package: external `npm install @emredogan/lumina-chat` çalışıyor mu?
- Lighthouse Mobile ≥ 98

## D. GIT

Branch: `feat/v3-phase4-recognition`
4 sub-PR.

## E. FINAL VALIDATION

- [ ] Auto-tweet: 30 günlük başarı oranı %100
- [ ] npm package: 50+ weekly downloads (3 ay sonra)
- [ ] Reverse Engineering Bento: viral candidate (1 X clip)
- [ ] Mobile Lighthouse ≥ 98

Phase 4 = ongoing. Kapanışı yok — continuous evolution.

==============================================
PHASE 4 SON.
==============================================
```

---

## 🛡️ 5. CROSS-PHASE INVARIANTS

Bu öğeler **tüm 4 phase boyunca değişmez**. Her phase prompt'unu execute eden agent, bu listeyi her başlangıçta hatırlar.

### 5.1 Görsel Kimlik (asla değişmez)

| Öğe | Değer |
|-----|-------|
| Accent renk | `#00d2ff` (Lumina cyan) |
| Background | `#000000` |
| Font | Geist (Latin subset) |
| H1 tracking | `-0.04em` ~ `-0.06em` |
| Glassmorphism | `.liquid-glass` + `.glass-panel` mevcut, yeni varyant YOK |
| Bento layout | 2×2 + 1×1 asimetrik (Phase 4 stage-gated rebalance) |
| Lumina avatar | half-overlap, cyan glow, 60px box-shadow |
| Cinematic intro | timing değişmez (300/900/1500/2000ms) |

### 5.2 Mimari (asla değişmez)

| Sistem | Karar |
|--------|-------|
| Routing | App Router (Next.js 16+) |
| Component model | Server-first, client islands |
| Animation engine | `motion/react` (only) |
| Styling | Tailwind v4 + tokens |
| Icons | `lucide-react` (only) |
| Form handling | Server actions |
| Auth (varsa) | TBD — Phase 3+ |
| Billing | Lemon Squeezy (Phase 3) |
| Database | KV (Phase 1) + DynamoDB (Phase 3) |

### 5.3 İçerik Kimliği (asla değişmez)

| Element | İçerik |
|---------|--------|
| Hero eyebrow | `19. Self-taught. Monk Mode.` |
| Hero H1 | `Emre Doğan.` |
| Brand color story | Cyan ışık + Monk Mode |
| Story hook | 01:30 bakery + school + build window |
| Lumina identity | AI representative, calm, technical |

### 5.4 Phase Order

Phase 1 → Phase 2 → Phase 3 → Phase 4. **Paralelleme YOK.** Bir önceki phase deploy edilmemiş ve stabile değilse, sonraki phase başlatılmaz.

---

## 🚫 6. ANTI-PATTERNS

Bu pattern'ler agent tarafından **kesinlikle uygulanmaz**:

### 6.1 Code Anti-Patterns

- ❌ **Random redesigns** — "iyileştirme" yapayım diye var olan UI değiştirme
- ❌ **AI-hallucinated architecture** — exist olmayan kütüphane API'leri
- ❌ **Unnecessary dependencies** — small utility yerine 30KB lib
- ❌ **Duplicate hooks** — aynı işi yapan custom hook'lar
- ❌ **Duplicate utility functions** — aynı işi yapan helper'lar farklı dosyalarda
- ❌ **Multiple competing animation paradigms** — motion + framer-motion + GSAP gibi
- ❌ **Giant client-side bundles** — Phase 2'deki Three.js mutlaka lazy
- ❌ **CSS chaos** — globals.css'de magic number'lar
- ❌ **Inline magic colors** — `rgba(0, 210, 255, 0.5)` yerine token
- ❌ **Uncontrolled blur stacking** — `backdrop-filter` 2+ katman aynı viewport'ta

### 6.2 Design Anti-Patterns

- ❌ **Cursor spotlight effect** — 2022'den beri cliché
- ❌ **Tilt cards** — overdone
- ❌ **Parallax scrolling hero** — generic
- ❌ **Particles.js background** — agency template signal
- ❌ **Animated number counters** — corporate dashboard hissi
- ❌ **Generic SaaS purple/blue gradients** — bizim renk cyan
- ❌ **3D spinning object as decoration** — purpose yok, sadece dikkat dağıtıyor
- ❌ **Auto-play video** — UX kötü, accessibility kötü
- ❌ **Confetti effects** — profesyonel olmayan
- ❌ **Loading screen > 1s** — perceived performance düşür

### 6.3 UX Anti-Patterns

- ❌ **Modal interrupts on first load** — Lumina dahil; Phase 1 + 0 sonrası 1500ms açılır, çok hızlı değil çok yavaş değil
- ❌ **Hostile UX flows** — visitor 6 saniye beklemez (Phase 0'da düzeltildi, koru)
- ❌ **Cluttered hover states** — bir element hover'da 3+ değişiklik yapmaz
- ❌ **Inconsistent button styles** — Hero'da primary CTA + secondary; bu pattern korunur

### 6.4 Performance Anti-Patterns

- ❌ **Client-side data fetching for content** — content static veya server-side render
- ❌ **No lazy loading for below-fold images** — `next/image` zaten yapıyor; manuel ekleme
- ❌ **Synchronous scripts in head** — analytics dahil
- ❌ **Layout-shifting on first paint** — CLS budget < 0.02

### 6.5 SEO Anti-Patterns

- ❌ **`<div>` ile semantic role taklit** — `<main>`, `<article>`, `<section>` kullan
- ❌ **Multiple h1 per route** — bir tek h1
- ❌ **Empty alt attributes for content images** — `alt=""` sadece decorative
- ❌ **Lighthouse SEO < 100** — her route 100 olmalı

### 6.6 Accessibility Anti-Patterns

- ❌ **No keyboard navigation** — tüm interactive elementler tabbable
- ❌ **Missing aria-labels on icon buttons** — Lumina close, mic, copy hepsi label'lı
- ❌ **Insufficient color contrast** — WCAG AA 4.5:1 minimum
- ❌ **Animations without `prefers-reduced-motion` respect** — Phase 1'de global guard ile çözüldü

---

## 📊 7. SUCCESS METRICS

Her phase'in **gerçek dünyada** ölçülebilir hedefi:

### Phase 1
- ✓ Lighthouse Mobile her route ≥ 95
- ✓ WCAG AA zero critical issue
- ✓ Lumina conversation persists
- ✓ GitHub feed API rate limit issue zero
- ✓ Edge runtime TTFB improvement measurable

### Phase 2
- ✓ 3D AWS Topology: 60fps desktop
- ✓ CWH Sandbox: visitor dwell time > 60s (analytics)
- ✓ Build Beacon: real commit → 60s pulse latency
- ✓ Lumina tool accuracy: 95%+ doğru cevap
- ✓ Lumina memory: cross-session continuity test pass

### Phase 3
- ✓ Voice mode: first audio token < 800ms
- ✓ /architecture dwell time > 3 dakika
- ✓ CWH Pro: ilk 5 paying customer
- ✓ Live customer counter: gerçek sayı > 0
- ✓ ProductionMetrics: live data fetched

### Phase 4
- ✓ Auto-tweet: 30 günlük başarı %100
- ✓ npm package: 50+ weekly downloads (3 ay sonra)
- ✓ Mobile Lighthouse ≥ 98
- ✓ Bento decompose: < 5% CPU idle

---

## 📝 8. POST-PHASE REFLECTION TEMPLATE

Her phase tamamlandıktan sonra, deploy edildikten 1 hafta sonra,
agent (veya insan) bu template'i çalıştırır ve doldurur:

```markdown
# Phase X Post-Mortem

## Tamamlananlar
- [ ] Step 1: ... — STATUS
- [ ] Step 2: ... — STATUS
...

## Beklenmeyen Olaylar
- ...

## Performans Etkisi
- LCP delta: ±X ms
- Bundle delta: ±X KB
- Lighthouse Mobile delta: ±X points

## Kullanıcı Geri Bildirimi (varsa)
- ...

## Gelecek Phase için Notlar
- Bir sonraki phase'e geçmeden önce dikkat edilmesi gerekenler

## Kaçırılan İdealler
- Roadmap'te olup atlanan/ertelenen feature'lar
```

Bu template, **her phase için** ayrı bir dosya olarak kaydedilir:
- `phase1-post-mortem.md`
- `phase2-post-mortem.md`
- ...

Dosyalar `.gitignore`'a eklenmez — repo'da kalır, gelecek phase'lerin
context'i olur.

---

## ✍️ KAPANIŞ NOTU

Bu doküman, agent'in **otonom yürütücü** olarak çalışmasını sağlar.

Bir Claude CLI agent:
1. Bu dokümanı tek bir komutla okur.
2. Phase 1 prompt'unu kopyalar.
3. Pre-scan'i yapar.
4. Step-by-step implement eder.
5. QC yapar.
6. Commit eder.
7. Push eder.
8. Phase 1 deploy gözlemler.
9. 1 hafta sonra Phase 2 prompt'una geçer.
10. ... döngü Phase 4'e kadar.

İnsan müdahalesi sadece:
- Production environment variable provisioning (KV, Bedrock, ElevenLabs)
- Vercel deploy approval (otomatik değilse)
- Critical decision points (Lemon Squeezy vs Stripe gibi)

Geri kalan: agent yürütür.

Bu sistem **deterministic, sıralı, defensible** — phase'ler arası
context drift yok, ad-hoc redesign yok, regression yok.

V3'ün **tek başına bir agent tarafından 12-18 ayda execute edilebilir**
operasyonel halidir.

— Director's Execution Notes

---

*Bu doküman PORTFOLYO_V3_ROADMAP.md (strategy) ile PORTFOLYO_V2_DENETIM.md
(audit) tarafından bilgilendirilmiştir. Stratejik karar gerektiğinde
roadmap'e başvurulur; teknik karar gerektiğinde audit'e başvurulur;
operasyonel karar gerektiğinde bu doküman authoritative'dir.*

05/15/2026