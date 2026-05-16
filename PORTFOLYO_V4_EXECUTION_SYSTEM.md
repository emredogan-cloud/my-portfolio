# PORTFÖY V4 — EXECUTION SYSTEM

> **Tür:** Operasyonel Engineering Playbook (elite internal sprint doc)
> **Tarih:** 16 Mayıs 2026
> **Versiyon:** 1.0
> **Önceki dokümanlar:**
> - [PORTFOLYO_V2_DENETIM.md](./PORTFOLYO_V2_DENETIM.md) (audit)
> - [PORTFOLYO_V3_ROADMAP.md](./PORTFOLYO_V3_ROADMAP.md) (strategy)
> - [PORTFOLYO_V3_EXECUTION_SYSTEM.md](./PORTFOLYO_V3_EXECUTION_SYSTEM.md) (V3 operational playbook)
> - [PORTFOLYO_V4_FUTURE_SYSTEMS.md](./PORTFOLYO_V4_FUTURE_SYSTEMS.md) (V4 vision)
>
> **Hedef:** Tek bir Claude CLI agent'in, bu dokümanı açıp V4 dönüşümünü 18-24 ay boyunca **minimum insan müdahalesi + maksimum solo-founder sustainability** ile execute etmesi.

---

## ⚠️ KIRMIZI ÇİZGİ — Bu Doküman Neyi DEĞİL'dir

Bu doküman bir **vizyon dokümanı değildir**. V4 FUTURE SYSTEMS vizyondur. Burası **operasyonel infaz**'dır.

Bu doküman bir **roadmap değildir**. Roadmap pazarlama belgesidir; bu bir mühendislik playbook'udur.

Bu doküman bir **arzular listesi değildir**. V4 vizyon dokümanı 60+ sistem listeler. Bu doküman onların hangisinin, ne sırayla, ne maliyetle, hangi hangi koşulla yapılacağını söyler — ve **çoğunluğunun ASLA yapılmayacağını** söyler.

Bu doküman bir **özgürlük belgesi değildir**. Tam tersi — bir **kısıtlama sözleşmesidir**. Agent (ya da Emre) bu dokümanın kısıtlarını ihlal ettiğinde, yapılan iş ekosistemi bozar.

---

## 📋 0. KULLANIM TALİMATI

### 0.1 Sıralama Kuralı

V4'te **5 phase** vardır. Sırasıyla execute edilir. Paralelleme **yoktur**:

```
Phase 1 (Foundation)    → ship → 30 gün observation
   ↓
Phase 2 (Public Lab)    → ship → 60 gün observation
   ↓
Phase 3 (Monetization)  → ship → 90 gün observation
   ↓
Phase 4 (AI-Native)     → ship → 90 gün observation
   ↓
Phase 5 (Experimental)  → CONDITIONAL — sadece metrikler tutarsa
```

"Production observation" = canlı trafik üzerinde regression yok, telemetry yeşil, kullanıcı şikayeti yok, ve **founder enerji metriği yeşil**.

### 0.2 Agent İşletim Modu

Her phase'in başında:

1. **Bu dokümanı tamamen oku.**
2. **V4 FUTURE SYSTEMS dokümanını tekrar oku** — vizyon yön belirler, bu doc icra eder.
3. **İlgili phase'in "Claude CLI Implementation Prompt" bölümünü oku (Bölüm 6).**
4. **Prompt'taki Pre-Scan'i atlama.** Her zaman çalıştır.
5. **Sub-PR'leri sırasıyla execute et.** Atlama yok.
6. **Her sub-PR sonrası deploy + 7 gün observation + telemetry check.**
7. **Phase sonunda squash YOK.** Per-step commit history korunur.

### 0.3 İptal / Geri Alma / Durma Hakkı

Agent ya da Emre herhangi bir noktada şu durumlardan biri tetiklenirse **DUR**:

- Performance bütçesi aşılır → root cause bul, fix et
- Lighthouse Mobile < 92 düşer → regression fix
- Telemetry SLO breach (Lumina p95 > 2s 24 saat boyunca) → rollback, post-mortem
- Build error → fix öncesi devam yok
- **Founder enerji metriği kırmızı** (3 ardışık hafta < 50% planned shipping) → mecburi 14-gün soğuma
- Bütçe çakışması (AWS Bedrock + Vercel + LLM aylık > $300) → cost optimization öncelikli

"Devam et" kararı her zaman **explicit** olmalı, otomatik değil.

### 0.4 Bu Doküman Üzerinde Değişiklik

Bu doküman canlı bir spec'tir ama:
- **Her revize bir PR olarak commit edilir.**
- Revizyon nedeni commit body'sinde açıklanır.
- Phase tanımı değişirse → mevcut phase **bitmeden** revize edilmez (in-flight phase frozen).
- Strategic değişiklik gerekirse → önce V4 FUTURE SYSTEMS güncellenir, sonra bu doc revize edilir.

### 0.5 Tek Cümlede Misyon

> Premium portföyü, solo-founder enerjisini koruyarak, **6 phase'de değil 5 phase'de**, ve **5 phase'in 4'ünü tamamlayıp 5.'sini koşullu bırakarak**, internetin saygın AI-native engineering ekosistemine dönüştürmek.

---

## 🧠 1. V4 EXECUTION PHILOSOPHY

V3 execution philosophy üzerine inşa edilir. Bu bölüm V3'tekileri tekrar etmez — sadece V4'e özgü prensipleri yazar.

### 1.1 Agent Düşünce Sırası (V4 Genişletilmiş)

```
1. Mevcut sistem ne yapıyor?              (Read + Grep)
2. Mevcut sistem yeterli mi?              (Decision)
3. Bu V4 vizyondaki hangi sistemi besler? (Leverage check — Bölüm 5)
4. Bu sub-PR Tier A mı, B mi, C mi?      (Priority gate — Bölüm 1.4)
5. Genişletme mi, yenisi mi?              (Default: GENİŞLET)
6. En küçük değişiklik ne?                (Surgical edit)
7. Bu phase scope'unda mı?               (Anti-creep gate)
8. Telemetry plan'ı ne?                   (Bölüm 2.13 — zorunlu)
9. Termination criteria'sı ne?            (Bölüm 10 — zorunlu)
10. Implement.
11. Verify (build + lighthouse + telemetry).
12. Commit.
```

**Yeni:** adım 8 (telemetry) ve adım 9 (termination criteria) zorunlu. V4'te ölçülemeyen sistem ship edilmez. Sunset koşulu tanımlanmayan sistem ship edilmez.

### 1.2 Erken İnşa Edilmemesi Gerekenler (Bilinçli Geç Bırakma)

Aşağıdakiler V4 vizyon dokümanında listelenir ama **Phase 1-3'te ASLA yapılmaz**:

| Sistem | Neden Erken Değil |
|--------|---------------------|
| WebGPU 3D topology | 4K kullanıcı/ay altında ROI yok; bundle ekleme maliyeti yüksek |
| Local-first LLM (WebLLM) | Distilled model UX şu an cloud Claude'a göre %40 daha kötü; visitor "ucuza" oynamak istemez |
| Multi-agent Lumina sub-agent registry | Single Lumina production-stable olana kadar fragmentation = bug çoğaltıcı |
| Real-time 3D cloud topology | Sadece 3+ AWS account aktif çalışırken anlamlı; bugün 1 var |
| Voice ambient mode (wake-word) | Privacy concern + permission UX karmaşık; opt-in voice button yeterli |
| Multimodal (screen share Lumina) | WebRTC peer infra maintenance ağır; ROI marjinal |
| `monk.emredogan.com` cohort forum | Cohort henüz launch edilmemiş; 50+ alumni alana kadar forum boş kalır |
| Autonomous CWH remediation (Phase B-D) | Tek bir yanlış auto-merge SaaS'in itibarını öldürür; manual approval kuralı kırılmaz |
| `/live` SSE dashboard | `/telemetry` aynı bilgiyi 5-dakika granularity ile verir; real-time stream maliyeti gereksiz |
| Sponsored Lumina answers | Önce 10K+ haftalık Lumina conversation gerekir; sponsor talebi olmadan launch ROI sıfır |
| Architecture-from-prompt lab | Bedrock cost en yüksek experiment; önce ucuz lab'lar traction üretsin |
| Distributed agent message bus | Single Lumina'nın memory federation'ı çözülmeden distributed = anarşi |

Bu liste **kırılmaz**. Trendy görünür diye eklenmez. PM yokluğu sayesinde "yapmamak" en güçlü karar.

### 1.3 Founder Enerjisi Korunumu

V4 bir kişi tarafından yürütülür. Kişi bakery shift + okul + kod aksında yaşar. Aşağıdakiler **operasyonel zorunluluk**:

| Mekanizma | Uygulama |
|-----------|----------|
| **Single-stream focus** | Aynı anda en fazla **1 phase + 1 distribution kanalı + 1 content type** aktif |
| **No-build days** | Haftada minimum 1 gün **kod yazılmaz** — sadece okuma, izleme, dinlenme |
| **Cadence ceiling** | Maks 1 sub-PR/hafta. Daha hızlı görünür ama maintenance debt birikir |
| **Trend-chase quarantine** | "X yeni çıktı, bizde de olsun" düşüncesi → 7 gün beklet → hala önemliyse değerlendir |
| **Done-then-pause** | Her sub-PR sonrası **48 saat dokunma**. Bug feedback gel diye |
| **Maintenance budget** | Aylık zamanın %25'i **yeni feature değil**, mevcut sistemlerin bakımı için |
| **Quitting permission** | Bir sistem 90 gün adopsiyon hedefini yakalamazsa **sunset** (Bölüm 10) — sunk cost yok |
| **Burnout circuit breaker** | 3 ardışık hafta < 50% planned ship → 14 gün mecburi off |
| **Public-facing kapasiteler** | YouTube + Twitter + blog + cohort + Discord aynı anda aktif olmaz; tier-based rollout |

### 1.4 Tier-Based Priority Sistemi

Her sub-PR ship öncesi **tier**'a atanır:

**Tier A — Highest Leverage (yapılır):**
- `@emredogan/lumina-chat` npm publish + adoption infra
- Auto-tweet 2.0 (multi-format content engine)
- `/telemetry` public dashboard
- `/lab` route + ilk 3 deney
- `npx emredogan` CLI v0.1
- Public engineering changelog (`/changelog`)
- GitHub authority infrastructure

**Tier B — Strong Leverage (Phase 3-4):**
- lumina-chat Pro (managed backend, billing)
- Premium API surface (`api.emredogan.com`)
- Infrastructure templates (cwh-saas-starter, vb.)
- Discord community (kapalı, OSS contributor için)
- Newsletter sistemi (weekly digest)
- Multi-agent Lumina (sadece 2 sub-agent ile başlar)
- Voice persistent button (wake-word DEĞİL)
- Cloud Lab (visitor brings AWS, scan-only)

**Tier C — Conditional (Phase 5, sadece metrikler tutarsa):**
- WebGPU simulations
- Local-first LLM mode
- Real-time 3D cloud topology
- Multimodal Lumina (screen share, vision)
- Autonomous CWH remediation
- `/live` SSE dashboard
- Cohort programı 2. iterasyon (1. cohort başarılıysa)

**Tier D — ASLA (V4 boyunca yapılmaz):**
- VC fundraising
- Multi-language i18n (Türkçe + İngilizce dışı)
- Mobile app (native)
- Slack/MS Teams integrations
- White-label enterprise
- Reseller programs
- Generic SaaS UI cliches (V3'te yasaklandı; korunur)

### 1.5 Phase Yapısı: Coherent Startup Milestone

Her phase **independently deployable bir startup milestone**:

| Phase | Milestone | Public Statement |
|-------|-----------|------------------|
| 1 | OSS launch + content engine kurulur | "I ship an npm package and I run a content engine" |
| 2 | Public engineering lab açılır | "I run a public laboratory; visitors use my tools" |
| 3 | Monetizasyon + community kurulur | "I have paying customers and OSS contributors" |
| 4 | AI-native operating layer ship edilir | "Lumina is more than chat; it's an operating layer" |
| 5 | Experimental ufuk genişletilir | "If conditions hit, the platform leaps to next category" |

Phase başarısı = milestone'un public algılanması. Internal feature list değil.

### 1.6 Cool Demo Syndrome Korunumu

**Cool demo syndrome:** havalı görünen bir feature'ı, ROI olmasa bile inşa etme isteği.

V4'te zorunlu üç-soru filter:

1. Bu demo **viral kandidat** mı? (Concrete: 30-saniye clip'lenebilir, retweet'lenir mi?)
2. Bu demo **product entry point** mı? (Visitor demo'yu görüp ürünü install/buy eder mi?)
3. Bu demo **maintenance cost**'u 6 ay sonra dahi affordable mı? (Çalışıp kalır, kullanmasa bile bozulmaz mı?)

3/3 → ship. 2/3 → değerlendir, defer kandidat. 1/3 veya 0/3 → **ASLA build etme**.

### 1.7 Distribution > Perfection Kuralı

V3'te "perfection" yüksek değerliydi. V4'te:

**Bir feature'ın %80 polished + ship + dağıtım, %100 polished + ship + dağıtım yok'tan iyidir.**

Pratik:
- Bir sub-PR ship edildikten sonra, **paralel olarak** Twitter post + YouTube demo + blog post draft hazırlanır
- Distribution shipping cadence'ten sonra değil, içine entegre
- "Feature done" = ship + 3 channel distribution drafted

---

## ⚙️ 2. GLOBAL ENGINEERING LAWS

V3'ün Global Engineering Rules'ı V4 boyunca **aynen** geçerli kalır. Bu bölüm V4'e özgü ek kuralları yazar.

### 2.1 OSS Publishing Disiplini

Her npm paket publish öncesi zorunlu:

- ✅ `lumina-chat` README pattern'i tam birebir takip eder (hero, badges, install, quick start, props table, composition, server contract, browser support, performance, roadmap, license)
- ✅ Sigstore provenance enabled (`publishConfig.provenance: true`)
- ✅ GitHub Actions publish workflow with typed-version confirmation gate
- ✅ Sürüm bumping disiplini: SemVer kırılmaz, breaking change = major
- ✅ CHANGELOG.md her release'de güncellenir
- ✅ Tarball file list `npm pack --dry-run` ile doğrulanmış
- ✅ Per-file ESM emission (tree-shaking için)
- ✅ Peer dependency'ler explicit (react/react-dom)
- ❌ Paket yayın günü Twitter post + LinkedIn post + blog hazır olmadan **publish edilmez** (distribution-first kuralı)

### 2.2 Telemetry Zorunluluğu

Her yeni system ship öncesi:

- ✅ En az **1 KV-backed metric** publish edilir
- ✅ Metric `/api/telemetry/<system>` endpoint'inden okunabilir
- ✅ `/telemetry` dashboard'da görünür
- ✅ Alerting threshold tanımlı (Sentry veya custom webhook)
- ✅ Cost telemetry (eğer LLM/AWS kullanıyorsa) — günlük cost projection

Ölçülemeyen sistem ship edilmez. Bu kural V3'te yumuşaktı, V4'te kırılmaz.

### 2.3 Public Transparency Disiplini

V4'ün marka kasası: transparency.

- ✅ Her ürünün pricing **public**. "Quote on request" tier yok.
- ✅ Lumina'nın system prompt'u **public** (`/lumina/brain` veya repo'da `lib/lumina/system-prompt.ts`)
- ✅ Lumina'nın tool registry'si **public** (`lib/lumina/tools.ts`)
- ✅ Eval pipeline scripts public
- ✅ Failure log public (her sistem için `<system>/failures.md` veya `/lumina/failures` page)
- ✅ Telemetry dashboard public
- ❌ Internal-only roadmap **yoktur**; bu doc ve V4 FUTURE SYSTEMS public

### 2.4 API Güvenlik ve Rate Limit Kuralları

Tüm public API endpoints (özellikle Phase 3 `api.emredogan.com`):

- ✅ API key auth (Lemon Squeezy subscription → generated key)
- ✅ Per-key rate limit (tier-based, KV-tracked)
- ✅ Per-IP rate limit (anonymous endpoint için fallback)
- ✅ Request audit log (anonimleştirilmiş, 30-gün retention)
- ✅ Cost cap per key (Bedrock token bütçesi)
- ✅ Public status page (`/status` veya `/telemetry`)
- ❌ Hiçbir endpoint auth-free LLM proxy değildir (cost abuse yasak)

### 2.5 Subdomain / Brand Identity Kuralı

Eğer subdomain federation Phase 4+'da yapılırsa:

- ✅ **Tüm subdomain'ler `packages/cinematic-ui`** kullanır (paylaşılan design system)
- ✅ Aynı Geist + #00d2ff + black identity
- ✅ Aynı Lumina embed
- ✅ Aynı Footer + BuildBeacon + LiveCustomerCounter
- ❌ Subdomain'a özgü branding **yoktur** — identity tutarlılığı kırılmaz

### 2.6 Founder Enerji Bütçesi

| Aktivite | Haftalık Tavan |
|----------|------------------|
| Yeni feature code | 8 saat |
| Bug fix / maintenance | 4 saat |
| Content (Twitter, blog, video) | 3 saat |
| Live build stream | 3 saat (1x90dk) |
| Community (Discord, replies) | 2 saat |
| Strategic thinking + docs | 2 saat |
| **Toplam** | **22 saat/hafta** |

Bakery shift + okul ile maksimum 22 saat sürdürülebilir. Bu sınır aşılırsa burnout circuit breaker tetiklenir.

### 2.7 Bundle ve Performance Bütçesi (V4 Genişletilmiş)

V3'ün bütçesi (180KB initial gz, 250KB hard) **aynen** korunur. Ek olarak:

| Metric | Hedef | Hard Limit |
|--------|-------|-----------|
| `/lab/<experiment>` page LCP | < 1.5s | < 2.5s |
| `/telemetry` LCP | < 1.2s (cached) | < 2.0s |
| `lumina-chat` npm package gzipped | < 20 KB | < 35 KB |
| `@emredogan/cinematic-ui` (Phase 4+) | < 40 KB | < 60 KB |
| WebGPU experiments (Phase 5) | Bundle quarantined | Sadece o route'ta |

### 2.8 Hydration Safety (V4 Critical)

V4'te eklenen tüm visitor-aware feature'lar (`/telemetry`, real-time pulse'lar, Lumina screen-aware suggestions) hydration güvenliği için:

- ✅ Server'da default state render edilir, mount sonrası gerçek değer
- ✅ KV read sonucu `cache: "no-store"` ile cold + `revalidate: 60` ile warm path
- ✅ `suppressHydrationWarning` sadece zaman/locale-dependent elementlerde
- ✅ Time-of-day display: skeleton → mount → gerçek

### 2.9 Edge Runtime Tercihleri

V3'te kuruldu, V4'te genişletildi:

- ✅ Tüm content + telemetry route'ları edge
- ✅ Tüm Lumina + Bedrock route'ları edge
- ✅ Webhook'lar (Lemon, GitHub) edge
- ⚠️ Whisper transcribe (büyük binary upload) → Node runtime kabul edilebilir
- ⚠️ ElevenLabs TTS streaming → edge tercih, Node fallback
- ✅ Cron'lar (auto-tweet, telemetry aggregation) → edge

### 2.10 Observability ve Cost Monitoring

V4'te zorunlu:

- ✅ Her LLM call'da token consumption KV'ye logging (anonymized)
- ✅ Günlük cost projection cron (`/api/cost-monitor`)
- ✅ Alarm threshold: günlük > $10 cost → Emre'ye email
- ✅ Vercel Functions duration histogram
- ✅ Cloudwatch + Sentry entegrasyonu (CWH için)

### 2.11 Lumina DNA Tutarlılığı

Tüm Lumina genişletmeleri (multi-agent, voice, screen-aware) için:

- ✅ Cyan #00d2ff (kırılmaz)
- ✅ "Calm, technical, calm" tone (kırılmaz)
- ✅ Welcome sequence three-layer unlock pattern (kırılmaz)
- ✅ Tool-use status pill rendering (kırılmaz)
- ✅ `prefers-reduced-motion` respect (kırılmaz)
- ✅ Privacy-first: hiçbir conversation cross-visitor paylaşılmaz açık consent olmadan

### 2.12 Animation Performance (V4 Critical)

V3 motion/react constraint'leri devam eder. Yeni:

- ✅ Lumina screen-aware suggestion (Phase 4) pulse animation idle ≤ 0.5% CPU
- ✅ Architecture playground (Phase 5) WebGPU sadece o route'ta — global yok
- ✅ Cloud topology 3D (Phase 5) idle 0% (RAF stop)

### 2.13 V4 Spesifik Telemetry Schema

Tüm yeni sistemler için KV key pattern:

```
v4:telemetry:<system>:<metric>:<bucket>
v4:eval:<system>:<period>:<score>
v4:cost:<system>:<date>:<usd>
v4:adoption:<system>:<date>:<count>
```

Örnek:
- `v4:telemetry:lumina:p95_latency:hourly` → number
- `v4:cost:bedrock:2026-05-16:usd` → number
- `v4:adoption:lumina-chat-npm:2026-05-16:downloads` → number

### 2.14 Sunset Disiplini

Her yeni sistem ship'inde:

- ✅ "Adoption threshold" tanımlı (Bölüm 10)
- ✅ "Maintenance ceiling" tanımlı
- ✅ "Sunset criteria" tanımlı
- ✅ KV key: `v4:lifecycle:<system>:status` = `active` / `sunset_warning` / `archived`

Threshold'a 90 gün içinde ulaşılamazsa → otomatik `sunset_warning`. Bir 90 gün daha → `archived`.

---

## 🔬 3. PRE-EXECUTION ANALYSIS

Bu bölüm, V4 FUTURE SYSTEMS'in 60+ sisteminin **arşivlik analizidir**. Phase architecture buradan türetildi.

### 3.1 STEP 1 — System Extraction

V4 vizyonundan çıkarılan **tam liste** (60 sistem):

#### Platforms
1. emredogan.com (mevcut meta-portfolio)
2. lab.emredogan.com (Public Engineering Laboratory)
3. lumina.emredogan.com (lumina-chat showcase)
4. cwh.emredogan.com (CWH Pro full product, mevcut cloudwastehunter.io)
5. monk.emredogan.com (Cohort program portal)
6. api.emredogan.com (Premium API gateway)

#### Products
7. @emredogan/lumina-chat (npm package — built, not published)
8. @emredogan/cwh-sdk (planned)
9. @emredogan/bedrock-toolkit (planned)
10. @emredogan/cinematic-ui (planned)
11. @emredogan/monk-mode-cli (planned)
12. @emredogan/emredogan-cli (npx emredogan, planned)
13. @emredogan/lumina-agents (sub-agent registry, planned)

#### Infrastructure Systems
14. Vercel KV (mevcut)
15. AWS Bedrock + DynamoDB (mevcut CWH için)
16. GitHub Actions (mevcut + genişletilecek)
17. Vercel Cron (mevcut)
18. Sentry (planned — error tracking)
19. ElevenLabs (mevcut TTS)
20. OpenAI Whisper (mevcut transcription)
21. Lemon Squeezy (mevcut, billing)
22. Discord server (planned — kapalı)
23. Discourse forum (planned, Phase 4+)
24. Redis pub/sub (planned, distributed agents için, Phase 5+)
25. WebGPU + WebLLM stack (planned, Phase 5)

#### Monetization Systems
26. CWH Pro (mevcut, billing live)
27. lumina-chat Pro (planned, managed backend)
28. Architecture Consulting (planned)
29. Monk Mode Cohort (planned)
30. Premium API access (planned)
31. Infrastructure Templates (planned)
32. Enterprise CWH (planned, conditional)
33. lumina-chat Enterprise (planned, conditional)
34. Sponsored Lumina answers (planned, conditional)
35. Recorded Courses (planned)

#### AI Systems
36. Lumina V2 (mevcut — tools, memory, voice)
37. Lumina V4 persistent companion (planned, Phase 4)
38. Lumina V4 repo awareness (planned, Phase 4)
39. Lumina V4.5 multi-agent (planned, Phase 4)
40. Lumina V5 screen awareness (planned, Phase 5)
41. Lumina V5 emotional adaptation (planned, Phase 5)
42. Lumina V5 voice as primary surface (planned, Phase 5)
43. Lumina V5 local-first WebLLM (planned, Phase 5)
44. Lumina V5 multimodal interfaces (planned, Phase 5)
45. AI observability / eval pipeline (planned, Phase 1)

#### OSS / Distribution Systems
46. npm publish workflow (mevcut, lumina-chat için)
47. Public changelog / engineering log (planned, Phase 1)
48. Auto-tweet 2.0 multi-format (planned, Phase 1)
49. Reverse engagement (Twitter mention monitor) (planned, Phase 2-3)
50. Clip extraction pipeline (planned, Phase 2-3)
51. YouTube channel + 4 series (planned, gradual)
52. Notes 2.0 multi-format publishing (planned, Phase 2)
53. Conference CFP pipeline (planned, Phase 3-4)
54. Newsletter (planned, Phase 3)
55. Live build streams (planned, Phase 3-4)

#### Experimental Systems
56. /lab experiments (8+ planned, Phase 2)
57. Cloud Lab (visitor STS connect) (planned, Phase 4)
58. Architecture Playground (planned, Phase 5)
59. WebGPU 3D topology (planned, Phase 5)
60. /live SSE real-time dashboard (planned, Phase 5)

### 3.2 STEP 2 — Dependency Graph

Sistemler arası bağımlılıklar:

```
[lumina-chat npm publish] ──┐
                             ├──→ [lumina-chat Pro managed backend]
[Lemon Squeezy billing] ─────┘                ↓
                                              ↓
[GitHub Actions publish CI] ─────→ [OSS ladder Tier 2-5]
                                              ↓
[/telemetry v1] ─────→ [Public credibility] ──┤
       ↓                                       ↓
[Eval pipeline]                       [Premium API surface]
       ↓                                       ↓
[Lumina V4 evals]                  [Enterprise tier conditional]

[Auto-tweet existing] ─→ [Auto-tweet 2.0 multi-format] ─→ [Clip extraction pipeline]
                                                                ↓
                                                       [YouTube content engine]
                                                                ↓
                                                       [Conference CFP demos]

[/lab MVP] ─→ [Experiment 1 IAM] ─→ [Experiment 2-3] ─→ [Cloud Lab visitor AWS]
                                                                ↓
                                                       [Architecture Playground]
                                                                ↓
                                                       [WebGPU simulations]

[Lumina V2 tools] ─→ [Lumina V4 repo awareness] ─→ [Lumina V4.5 multi-agent]
                                                          ↓
                                                 [Lumina V5 specialized]

[Discord launch] ─→ [Contributor docs] ─→ [Cohort program] ─→ [Forum launch]
```

**Kritik bottleneck'ler (dependency hub'ları):**
- `lumina-chat npm publish` 7 sistemi bloklar
- `/telemetry v1` 5 sistemi bloklar (eval, premium API, public credibility)
- `Auto-tweet 2.0` 3 distribution sistemi bloklar
- `/lab MVP` 4 experimental sistemi bloklar
- `Lumina V4 repo awareness` 2 V5 sistemi bloklar

**Foundational systems (önce inşa edilir):**
1. lumina-chat npm publish (Phase 1)
2. /telemetry v1 (Phase 1)
3. Auto-tweet 2.0 (Phase 1)
4. /lab MVP + Experiment 1 (Phase 2)
5. lumina-chat Pro infra (Phase 3)

### 3.3 STEP 3 — System Classification

60 sistem 7 kategoriye:

#### Category 1 — Core Infrastructure (immediate, Phase 1-2)
- Vercel KV (mevcut)
- GitHub Actions publish CI (mevcut)
- Vercel Cron (mevcut)
- Edge runtime stack (mevcut)
- Sentry error tracking (planned)
- `/telemetry` aggregator (planned, Phase 1)

#### Category 2 — Distribution Engines (Phase 1-3, layered)
- Auto-tweet 2.0
- npm publish workflow (mevcut, replicate)
- /changelog public engineering log
- Clip extraction pipeline
- YouTube content engine
- Newsletter
- Live build streams

#### Category 3 — Monetization Systems (Phase 3, ordered)
- lumina-chat Pro (highest leverage, lowest support)
- Premium templates (zero maintenance)
- Premium API (recurring + high margin)
- CWH Pro growth (mevcut, optimize)
- Cohort program (time-intensive ama community)
- Consulting (conditional, ay 12+)
- Enterprise tiers (conditional, inbound demand only)
- Sponsored answers (conditional, 10K+ Lumina conversation gerekir)

#### Category 4 — Ecosystem Systems (Phase 3-4)
- Discord (kapalı OSS contributor)
- Discourse forum (cohort alumni için)
- npm package family (5-tier ladder, gradual)
- API gateway (`api.emredogan.com`)
- Cinematic UI shared design system

#### Category 5 — Experimental Research (Phase 5, conditional)
- WebGPU 3D topology
- Local-first LLM (WebLLM)
- Multimodal Lumina (vision, screen share)
- Distributed agent message bus
- Autonomous CWH remediation (Phase B-D)
- `/live` SSE real-time dashboard

#### Category 6 — Founder Branding Systems (cross-phase)
- Cinematic identity protection (V3 carry-over)
- Public transparency (system prompts, eval, failures all public)
- Conference talk pipeline (3 CFP draft)
- AGENTS.md / CLAUDE.md as adoptable template
- Solo-builder narrative (Monk Mode story)

#### Category 7 — Long-term Moonshots (V5 or never)
- emredogan-os (full federated subdomain ecosystem)
- AI-assisted DevOps (Lumina deploy operatörü)
- Self-healing infrastructure
- Industry-standard library status (npm install reflexively recognized)

### 3.4 STEP 4 — Speculative System Detection

Aşağıdaki sistemler V4 vizyon dokümanında yer alır ama **spekülatiftir** ve **execution'a girmeden önce yeniden değerlendirilmeli**:

| Sistem | Spekülasyon Nedeni | Karar |
|--------|---------------------|-------|
| WebGPU 3D cloud topology | Browser support fragmente, kullanım rare | **Defer to Phase 5, gate on traffic** |
| Local-first WebLLM | Distilled model UX zayıf, bundle ağır | **Defer to Phase 5, gate on demand** |
| Multimodal screen share | WebRTC infra ağır, privacy concerns | **Defer indefinitely; review yearly** |
| Distributed agent message bus | Anarchy risk, single Lumina daha yetersizken erken | **Phase 5+, sadece 10+ third-party agent talep gelirse** |
| Autonomous CWH remediation Phase B-D | Tek hatalı auto-merge SaaS itibarını bitirir | **Phase 5+, sadece Phase A 6 ay sorunsuz çalışırsa** |
| Voice ambient mode (wake-word) | Privacy + permission UX karmaşık | **Phase 5+, opt-in voice button yeterli kalırsa skip** |
| Conference talk talep | Submission fakat acceptance kontrolsüz | **Talep et, accept'i metric'e bağlama** |
| Cohort 50-student per quarter | Recruit + retention zor | **İlk cohort 20 student'a aim et, success'e göre büyüt** |
| Monk Mode Cohort sürdürülebilir | Time-intensive synchronous calls | **Quarterly maksimum 1 cohort; daha sık tekrarlanırsa burnout** |
| Sponsored Lumina answers | Sponsor talep yokken launch ROI sıfır | **Phase 5+, sadece 10K+ haftalık conversation varsa** |
| Subdomain federation (`lab.`, `lumina.`, vb.) | Infra overhead büyük, ROI marjinal | **Phase 4+, ve sadece domain başına 1K+ unique visit/ay varsa** |

### 3.5 STEP 5 — Leverage Analysis

**Leverage skoru = (potansiyel impact × compounding effect) / (maintenance cost + execution time)**

Skor 1-10 (10 en yüksek):

| Sistem | Leverage Skoru | Neden |
|--------|------------------|-------|
| `lumina-chat` npm publish | **10** | Built, just push button. Maximum compounding (her install = 1 brand exposure) |
| Auto-tweet 2.0 multi-format | **9** | Cron-based, zero ongoing time. Compounds daily |
| `/telemetry` public dashboard | **9** | Brand credibility per visitor visit, near-zero maintenance |
| `/lab` MVP + Experiment 1 | **9** | Each experiment compounds; first 3 viral candidate |
| Public changelog `/changelog` | **8** | Brand authority signal, auto-generated from git |
| `npx emredogan` CLI v0.1 | **8** | Developer-first distribution; 1 install = repeat user |
| YouTube Monk Mode series | **8** | Content compounding, low marginal cost per video |
| lumina-chat Pro managed | **7** | High leverage MRR ama infra setup ağır |
| Premium templates | **8** | Zero maintenance after sale, high margin |
| Premium API | **7** | High leverage recurring; cost monitoring + abuse risk |
| Multi-agent Lumina V4.5 | **5** | Cool but complex; Single Lumina hardening daha yüksek leverage |
| Cohort program | **6** | Yüksek revenue ama time-intensive (low scaling) |
| WebGPU simulations | **3** | Cool factor high, ROI uncertain |
| Local-first WebLLM | **2** | Niche use, distilled UX zayıf |
| Multimodal screen share | **2** | Privacy + infra debt high, ROI marjinal |
| Autonomous CWH Phase B-D | **3** | Reputation risk yüksek, kontrolü zor |

**Top 5 leverage:**
1. lumina-chat npm publish (10)
2. Auto-tweet 2.0 (9)
3. /telemetry (9)
4. /lab MVP + Experiment 1 (9)
5. Premium templates (8)

Bu 5 sistem Phase 1-2'de bitmeli.

### 3.6 STEP 6 — Execution Bottleneck Analysis

**Engineering bottlenecks:**
- Solo developer time → maksimum 1 sub-PR/hafta
- Sub-agent Lumina V4.5 her agent için ayrı system prompt + tool reg + eval = ~3-5 gün
- WebGPU experiments her biri ~7-14 gün

**Maintenance bottlenecks:**
- 5+ npm package = haftalık 3-5 saat dep + security update
- Discord + Forum + Newsletter aynı anda = haftalık 6+ saat moderation
- Live build streams 2x/hafta = haftalık 8 saat (içerik + production)

**Content bottlenecks:**
- YouTube video 1/hafta = ~6 saat (kayıt + edit + thumbnail + upload)
- Twitter daily standup auto (cron, sıfır time)
- Twitter weekly thread auto (cron, sıfır time)
- Twitter reverse engagement (manuel approve) = haftalık 2 saat

**Deployment bottlenecks:**
- Vercel build limit (10/saat free tier ama paid yok)
- npm publish provenance = OIDC token, GitHub-side gate
- Pre-deploy Lighthouse audit = 5 dakika/route × 8 route = 40 dakika

**Scalability bottlenecks:**
- AWS Bedrock free tier sınırlı; visitor flood = cost spike
- Vercel KV free tier 30K commands/day; popular metrik route ısrar ederse hit
- ElevenLabs API quota; voice high-usage = cost surprise

**Founder-energy bottlenecks:**
- Bakery 01:30 shift + okul = günde maks 4-5 saat dev
- Haftada maks 22 saat sustainable
- Burnout risk yüksek: 3-ardışık-week 100%+ load → çöküş

**Architecture complexity bottlenecks:**
- Multi-agent Lumina debug ağır
- Subdomain federation infra overhead büyük
- Distributed message bus failure mode'ları çok

### 3.7 Pre-Execution Final Verdict

Pre-execution analysis sonucu **şu net önceliklendirmeler**:

**MUTLAKA YAP (Phase 1-2):**
- lumina-chat npm publish
- /telemetry v1
- Auto-tweet 2.0
- /lab MVP + 3 experiment
- npx emredogan CLI v0.1
- /changelog
- 1 YouTube series (Monk Mode Diary)

**KOŞULLU YAP (Phase 3-4):**
- lumina-chat Pro (Phase 3, sadece npm 500+ haftalık DL'a ulaşırsa)
- Premium API (Phase 3, sadece organic API demand sinyali varsa)
- Multi-agent Lumina (Phase 4, sadece Lumina V4 hardened sonrası)
- Voice persistent button (Phase 4, sadece voice opt-in adoption > 20% ise)
- Cohort program (Phase 3-4, sadece YouTube + Twitter 5K+ follower'a ulaşırsa)
- Discord (Phase 3, sadece OSS package external contributor signal varsa)

**ASLA YAPMA (V4 boyunca):**
- VC fundraising
- Multi-language i18n
- Generic SaaS clichés
- Auto-merge (kullanıcı onayı bypass)
- Sürekli yeni feature ekleme; mevcut sistemleri terk etme

**EFFICIENT EŞİT MASRAFTA YAP:**
- /telemetry için Vercel KV (mevcut) → ekstra DB değil
- Auto-tweet 2.0 için mevcut twitter-client.ts (V3) → yeni package yok
- /lab için mevcut Bedrock client → yeni LLM stack yok
- Notes 2.0 audio için mevcut /api/voice/tts (V3) → yeni provider yok

---

## 🏗️ 4. PLATFORM PHASE ARCHITECTURE

**5 phase. 4'ü zorunlu, 5.'si koşullu.**

```
Phase 1 ─── OSS Launch & Distribution Foundation     (60-90 gün)
   ↓
Phase 2 ─── Public Engineering Laboratory             (90-120 gün)
   ↓
Phase 3 ─── Monetization & Community Layer            (90-120 gün)
   ↓
Phase 4 ─── AI-Native Operating Layer                 (120-180 gün)
   ↓
Phase 5 ─── Experimental Expansion (CONDITIONAL)      (180+ gün, opsiyonel)
```

### 4.1 PHASE 1 — OSS LAUNCH & DISTRIBUTION FOUNDATION

**Süre:** 60-90 gün
**Tipi:** Distribution foundation + telemetry baseline + OSS launch
**Risk Seviyesi:** DÜŞÜK
**Leverage Skoru:** 9/10

#### Mission

V3'te inşa edileni **dünyaya açmak**. Hiçbir yeni vizyon feature'ı yok — sadece V3 OSS'i publish et, content engine'i otomatize et, telemetry'yi public yap.

#### Strategic Outcome

Phase 1 sonunda:
- npm'de `@emredogan/lumina-chat@0.1.0` yayında
- Twitter'da haftada 8 otomatik post (1 günlük standup × 7 + 1 weekly architecture thread)
- `/telemetry` public dashboard'da Lumina + cron + auto-tweet metrikleri canlı
- `/changelog` her commit'in WHY-annotation'ını gösteriyor
- 1 YouTube series (Monk Mode Diary) başlamış, en az 4 video published
- GitHub repo Sponsors enabled, public README cinematic

#### Systems Introduced

| Sistem | Tier | Kaynak |
|--------|------|--------|
| `@emredogan/lumina-chat@0.1.0` publish | A | `packages/lumina-chat/` (mevcut) |
| `/telemetry` v1 dashboard | A | Yeni: `app/telemetry/page.tsx`, `/api/telemetry/<metric>` |
| Auto-tweet 2.0 multi-format | A | Genişletme: `app/api/auto-tweet/route.ts` |
| `/changelog` public engineering log | A | Yeni: `app/changelog/page.tsx`, GitHub Events API |
| YouTube Monk Mode Diary | A | External: OBS + DaVinci Resolve free, manuel |
| GitHub Sponsors + README polish | A | Repo metadata + visual cinematic upgrade |
| Sentry error tracking | A | Yeni dep: `@sentry/nextjs` |

#### Systems Postponed (Tier B/C)

Phase 1'de **YAPILMAZ**:
- lab.emredogan.com (Phase 2)
- lumina-chat Pro (Phase 3)
- Multi-agent Lumina (Phase 4)
- WebGPU experiments (Phase 5)
- Voice persistent button (Phase 4)
- Discord community (Phase 3)
- Cohort program (Phase 3-4)
- `npx emredogan` CLI (Phase 2 — content engine first)
- Premium API (Phase 3)
- Newsletter (Phase 3)

#### Dependency Graph

```
[lumina-chat publish] ── depends on ──→ [NPM_TOKEN secret in repo]
[/telemetry v1] ─────── depends on ──→ [Sentry setup + KV metrics schema]
[Auto-tweet 2.0] ────── depends on ──→ [Existing Twitter creds (V3)]
[/changelog] ────────── depends on ──→ [GitHub API (existing)]
[YouTube series] ─────── depends on ──→ [None — manual]
[GitHub Sponsors] ────── depends on ──→ [Personal GitHub account setup]
```

#### Revenue Impact

**Direct:** $0. Phase 1 distribution + credibility. Revenue Phase 3'te başlar.

**Indirect:** lumina-chat npm install'ları → Phase 3 lumina-chat Pro conversion funnel'ın başı.

#### Distribution Impact

**Twitter:** günde 1 tweet otomatik (mevcut V3) → Phase 1 sonunda günde 1 + haftada 1 thread = haftada 8 post
**npm:** 0 → hedef 100 weekly downloads (Phase 1 sonu)
**GitHub:** mevcut + Sponsors + premium README → 50+ stars/ay hedef
**YouTube:** 0 → 100 subscriber hedef
**Lumina:** mevcut + telemetry surface'ı → "look inside" cazibesi

#### Maintenance Cost

| Sistem | Aylık Saat |
|--------|------------|
| npm package security update + dep cleanup | 2 |
| /telemetry metric refresh + alert response | 1 |
| Auto-tweet 2.0 cron izleme + failure response | 1 |
| /changelog auto-sync ama occasional manuel fix | 1 |
| YouTube 1 video/hafta = 4-5 video/ay | 24 |
| GitHub README + Sponsors response | 1 |
| **Toplam** | **30 saat/ay** |

**Critical:** YouTube en ağır maintenance. Eğer founder enerjisi bu kapasiteyi sürdüremezse → YouTube haftada 1'den ikinci hafta 1'e düşür.

#### Implementation Risk

| Risk | Olasılık | Şiddet | Mitigasyon |
|------|----------|--------|------------|
| npm publish ilk yayın failure | Düşük | Orta | Dry-run pack + `npm publish --dry-run` ön test |
| Telemetry KV cost explosion | Düşük | Yüksek | Per-metric rate limit + 5dk aggregation |
| Auto-tweet 2.0 sürekli aynı içerik | Orta | Düşük | KV-tracked content history; tekrar yasak |
| YouTube içerik kalitesi düşük | Yüksek | Düşük | İlk 4 video "imperfect ship" — feedback loop |
| GitHub Sponsors signup karmaşık | Düşük | Düşük | Setup tek seferlik; 30 dk |
| Sentry quota aşımı | Düşük | Orta | Free tier 5K event/ay → upgrade ya da sampling |

#### Burnout Risk

**Yüksek-orta.** YouTube haftalık 1 video taahhüdü solo-founder için ağır. Mitigasyon:
- İlk 4 video "imperfect" — perfectionism yasak
- Editing'i 60 dakikaya cap
- Thumbnail template kullan, custom design yok
- Eğer 4. hafta'da tekrar dolmuyorsa → ikinci hafta 1 cadence'a düş

#### Rollback Plan

Her sub-PR atomic commit. Sorun:
```bash
git revert <step-commit>
git push
```

Yayın sonrası npm publish geri alınamaz ama `npm deprecate` ile uyarı eklenebilir. Bu Phase 1'de YOK — ilk version production-stable olarak ship edilir.

#### Success Criteria

- [ ] `npm install @emredogan/lumina-chat` çalışıyor
- [ ] npm sayfasında provenance badge görünür
- [ ] /telemetry public, 5+ metrik gösteriyor, refresh otomatik
- [ ] Auto-tweet 2.0: 30 gün boyunca 0 failure
- [ ] /changelog: son 30 commit görünür
- [ ] YouTube 4+ video, 100+ subscriber
- [ ] GitHub Sponsors page enabled
- [ ] Lighthouse Mobile her route ≥ 92 (V4 hedef düşürüldü çünkü telemetry interactive)
- [ ] Founder energy yeşil (haftada ≤ 22 saat, 0 burnout signal)

#### Founder Energy Impact

**Haftalık beklenti:** ~12 saat (8 dev + 4 content). Manageable.

**Risk:** YouTube video çekimi içerik blok. Önlem: pre-recorded batch 4 video Phase 1 başında.

#### Leverage Score: 9/10

Tek bir Phase'te birden çok compounding sistem başlatır. Foundational.

---

### 4.2 PHASE 2 — PUBLIC ENGINEERING LABORATORY

**Süre:** 90-120 gün
**Tipi:** Public lab launch + visitor as co-operator + content depth
**Risk Seviyesi:** ORTA
**Leverage Skoru:** 8/10

#### Mission

Visitor'ı **okuyucudan kullanıcıya** dönüştürmek. `/lab` route'unu açmak, 3 çalışan deneyle başlatmak, visitor'a "Emre'nin aletliğini al, kullan" hissini vermek.

#### Strategic Outcome

Phase 2 sonunda:
- `/lab` route canlı, 3 working experiment
- `npx emredogan` CLI v0.1 npm'de (browse, ask, project list, demo run)
- Notes 2.0 multi-format pipeline (audio + interactive diagram)
- 2. YouTube series başlamış (Architecture-from-Scratch)
- /telemetry'de adoption metrikler — visitor lab usage tracked
- Reverse engagement (Twitter mention monitor) MVP

#### Systems Introduced

| Sistem | Tier | Kaynak |
|--------|------|--------|
| `/lab` route scaffold | A | Yeni: `app/lab/page.tsx`, `app/lab/[slug]/page.tsx` |
| Experiment 1: IAM policy translator | A | Yeni: `/lab/iam-translator` + `/api/lab/iam-translate` |
| Experiment 2: Prompt rescuer | A | Yeni: `/lab/prompt-rescuer` + `/api/lab/prompt-rescue` |
| Experiment 3: Commit narrator | A | Yeni: `/lab/commit-narrator` + `/api/lab/narrate-commits` |
| `@emredogan/cli` v0.1 npm package | A | Yeni: `packages/emredogan-cli/` |
| Notes 2.0 audio + interactive diagrams | A | Genişletme: `data/notes.ts` + audio gen pipeline |
| Reverse engagement Twitter monitor | A | Yeni: `/api/twitter-monitor` cron + admin approval UI |
| YouTube Architecture-from-Scratch | A | External: 2 video/ay |
| `/changelog` sürekli besleme | A | Phase 1 sistem refinement |

#### Systems Postponed

- Cloud Lab (visitor brings AWS) — Phase 4 (STS infra complex)
- 5+ lab experiments — Phase 4-5 (3 yeterli proof)
- Subdomain `lab.emredogan.com` — Phase 4+ (path-based başlat)
- Clip extraction pipeline — Phase 3 (önce manual clip ile öğren)

#### Dependency Graph

```
[/telemetry from Phase 1] ──→ [/lab adoption metrikleri]
[Lumina V2 tools]         ──→ [Lab experiments use Bedrock proxy pattern]
[Auto-tweet 2.0]          ──→ [Reverse engagement (drafted replies UI)]
[Bedrock client (V3)]     ──→ [3 experiment LLM calls]
[/api/voice/tts (V3)]     ──→ [Notes 2.0 audio generation]
[npm publish workflow]    ──→ [@emredogan/cli publish (Phase 1 template copy)]
```

#### Revenue Impact

**Direct:** $0. Phase 2 hala adoption focus.

**Indirect:** `/lab` viral candidate → Twitter share artar → npm install artar → Phase 3 Pro conversion artar.

#### Distribution Impact

**Twitter:** günlük standup + weekly thread + reverse engagement drafted replies = haftada 12+ post
**npm:** lumina-chat 100 → hedef 300/hafta + emredogan-cli 50/hafta
**GitHub:** /lab visitor'ları repo'ya bakacak → 100+ stars/ay
**YouTube:** 2 series aktif, hedef 500 subscriber
**Lumina:** /lab experiment'ları içinde Lumina kullanılır → engagement artar

#### Maintenance Cost

| Sistem | Aylık Saat |
|--------|------------|
| 3 experiment failure response | 2 |
| Notes 2.0 audio pipeline (her note yayın sonrası) | 1 |
| Twitter reverse engagement approval | 8 (haftada 2sa) |
| YouTube 2 video/ay | 12 |
| `/changelog` curation (Phase 1'den) | 1 |
| CLI bug response | 2 |
| **Toplam** | **26 saat/ay** |

#### Implementation Risk

| Risk | Olasılık | Şiddet | Mitigasyon |
|------|----------|--------|------------|
| /lab experiment Bedrock cost spike | Orta | Yüksek | Per-IP rate limit + cost cap per visitor |
| CLI cross-platform bug (Windows ESM) | Yüksek | Düşük | İlk version POSIX-only, Windows defer |
| Notes 2.0 audio generation TTS cost | Düşük | Düşük | Build-time generation, not runtime |
| Reverse engagement spam algılaması | Orta | Orta | Conservative draft, Emre approval gate |
| Lab adoption düşük | Orta | Düşük | İlk experiment IAM en geniş demografik — yüksek viral şans |

#### Burnout Risk

**Orta.** Phase 1'den daha hafif (YouTube haftada 1 → 2 ayda 1 video). Lab experiment ship cadence (1/ay) sürdürülebilir.

#### Rollback Plan

Her experiment ayrı route. Bir experiment broken ise sadece o route disable:
```tsx
// app/lab/iam-translator/page.tsx
export default function() {
  return <ExperimentMaintenancePage />;
}
```

Phase'i tamamen rollback gerekmez — sub-PR level rollback yeterli.

#### Success Criteria

- [ ] /lab route canlı, 3 experiment çalışıyor
- [ ] Her experiment'in /telemetry'de adoption count
- [ ] `npx emredogan ask "..."` çalışıyor
- [ ] `npx emredogan project list` çalışıyor
- [ ] Notes 2.0: en az 1 note 3+ format (longform + audio + diagram)
- [ ] Reverse engagement: haftada 5+ drafted reply, Emre 2-3 approve
- [ ] YouTube Architecture-from-Scratch: 4+ video
- [ ] npm downloads: lumina-chat 300/hafta + emredogan-cli 50/hafta
- [ ] Lighthouse Mobile ≥ 90 (lab routes biraz daha yavaş kabul edilebilir)

#### Founder Energy Impact

**Haftalık:** ~14 saat (10 dev + 4 content + reverse engagement). Sürdürülebilir.

**Risk:** Twitter reverse engagement zaman tuzağı. Mitigasyon: 30dk/gün hard cap, fazlası skip.

#### Leverage Score: 8/10

Multi-channel compounding ama Phase 1 kadar foundational değil.

---

### 4.3 PHASE 3 — MONETIZATION & COMMUNITY LAYER

**Süre:** 90-120 gün
**Tipi:** İlk paid product launches + community infra
**Risk Seviyesi:** ORTA-YÜKSEK
**Leverage Skoru:** 8/10

#### Mission

Hayatta kalma: ilk meaningful recurring revenue. lumina-chat Pro, ilk premium template, Premium API surface, ve community foundation (Discord).

#### Strategic Outcome

Phase 3 sonunda:
- lumina-chat Pro live, **ilk 10 paying customer**
- 1-2 premium template satıyor ($199-499)
- `api.emredogan.com` live, ilk 5 API key satılmış
- Discord kapalı OSS contributor server canlı
- Newsletter weekly digest (200+ subscribers)
- Clip extraction pipeline (manual approval'lı)
- Phase 1-2'den toplam MRR ≥ $1K

#### Systems Introduced

| Sistem | Tier | Kaynak |
|--------|------|--------|
| lumina-chat Pro managed backend | B | Yeni: ayrı Next.js app veya `app/pro-backend/` route group |
| Auth + billing: Lemon Squeezy (zaten var) | B | Existing extension |
| Premium template #1: cwh-saas-starter | B | Yeni: `packages/templates/cwh-saas-starter/` |
| `api.emredogan.com` gateway | B | Yeni: ayrı Vercel project veya `/api/v1/*` |
| API key auth + rate limit | B | Yeni: `lib/api-auth.ts`, KV-tracked |
| Discord server (kapalı, OSS contributor) | B | External setup |
| Newsletter (Resend integration) | B | Mevcut: Resend zaten dep |
| Clip extraction pipeline (semi-auto) | B | Yeni: ffmpeg + Lumina best-answer detection |

#### Systems Postponed

- Cohort program — Phase 3 sonu eğer 5K+ Twitter follower varsa
- Discourse forum — Phase 4+ (cohort alumni gerekir)
- 5+ infrastructure templates — Phase 4 (ilk 1-2 satışına göre devam)
- Enterprise tier (CWH veya lumina-chat) — Conditional, sadece inbound demand
- Sponsored Lumina answers — Phase 5+
- Architecture consulting — Phase 4+ (organic talep beklenir)

#### Dependency Graph

```
[/telemetry from Phase 1]  ──→ [API key usage tracking]
[lumina-chat npm publish]  ──→ [lumina-chat Pro managed conversion funnel]
[Bedrock client]           ──→ [Pro backend uses same infra]
[Lemon Squeezy V3]         ──→ [Pro billing + template purchases]
[npm publish workflow]     ──→ [Template tarball publishing]
[Auto-tweet 2.0]           ──→ [Pro launch announcement automation]
```

#### Revenue Impact

**Hedef Phase 3 sonu MRR:** $1K-$2K

| Stream | Target Customers | Avg | MRR |
|--------|-------------------|-----|-----|
| lumina-chat Pro | 10 | $49 | $490 |
| Premium templates (1-2) | 5 sales total | $299 | $0 (one-time, but adds $1495 cash) |
| Premium API | 5 | $99 | $495 |
| **MRR Total** | | | **$985** |
| **One-time** | | | **$1,495** |

#### Distribution Impact

**Newsletter:** 0 → 200+ subscribers (lead magnet: Phase 1-2 lab adoption)
**Discord:** 0 → 50+ contributor (invite-only via npm package usage)
**Clip extraction:** 4-8 clips/ay → 1 viral candidate hedef
**Twitter:** organic growth ~3K-5K follower hedef

#### Maintenance Cost

| Sistem | Aylık Saat |
|--------|------------|
| Pro backend incident response | 3 |
| Template support (kullanıcı sorusu) | 4 |
| API key support + abuse review | 2 |
| Discord moderation | 4 |
| Newsletter weekly draft + send | 4 |
| Clip extraction approval | 4 |
| YouTube + Twitter ongoing | 12 |
| **Toplam** | **33 saat/ay** |

**ALARM:** 33 saat/ay maintenance + 8 saat/hafta yeni feature = 40+ saat/hafta. Founder bütçesini aşar.

**Mitigation:** Phase 3 sonu durumu:
- Eğer Pro 10 customer'a ulaştıysa → mevcut systems optimize, yeni feature don. Phase 4'e geç
- Eğer Pro < 5 customer ise → community feature'ları (Discord, newsletter) sunset

#### Implementation Risk

| Risk | Olasılık | Şiddet | Mitigasyon |
|------|----------|--------|------------|
| Pro backend reliability düşük | Orta | Çok Yüksek | Lemon Squeezy proxy + Vercel KV + comprehensive Sentry |
| API key abuse → cost blowup | Yüksek | Yüksek | Hard cap per key/day + alert + auto-disable |
| Template bug → support volume | Orta | Orta | Documentation + FAQ + GitHub Issues template |
| Discord became time sink | Yüksek | Orta | Kapalı invitation-only; 30 dk/gün cap |
| Newsletter open rate düşük | Orta | Düşük | A/B test subject lines, kısa format |
| Clip extraction noise | Yüksek | Düşük | Aggressive approval gate; bad clip post yapılmaz |

#### Burnout Risk

**Yüksek.** En riski Phase. Maintenance + new feature + content overlap.

**Mecburi:**
- Discord 30dk/gün, fazlası ertesi gün
- Pro support: kullanıcı email'leri batch'le (haftada 1 cevap)
- Eğer Phase 3'te burnout signal → Phase 4'e geçmeden 14 gün off

#### Rollback Plan

| Sistem | Rollback |
|--------|----------|
| Pro backend | API endpoint disable + refund issued |
| Premium template | npm deprecate; existing buyers keep access |
| API gateway | Disable key auth → public endpoint reverts |
| Discord | Pause invitations; existing members keep access |
| Newsletter | Auto-responder "paused for review" |

#### Success Criteria

- [ ] lumina-chat Pro: 10+ paying customer
- [ ] Premium template: 5+ sales (cwh-saas-starter)
- [ ] Premium API: 5+ active key
- [ ] Discord: 50+ contributor member
- [ ] Newsletter: 200+ subscriber, > 30% open rate
- [ ] Clip extraction: 1+ viral candidate (10K+ X view)
- [ ] MRR ≥ $1K
- [ ] /telemetry'de tüm Phase 3 sistemler tracked
- [ ] Founder energy yeşil (haftalık ≤ 22 saat sürdürülebilir)

#### Founder Energy Impact

**Yüksek risk Phase.** Mitigasyon zorunluluk:
- 1 ardışık haftada 30 saat aşılırsa → mecburi 7 gün off
- 3 ardışık hafta 25+ saat → 14 gün off + scope cut

#### Leverage Score: 8/10

İlk revenue, kritik milestone. Ama maintenance burden compounding.

---

### 4.4 PHASE 4 — AI-NATIVE OPERATING LAYER

**Süre:** 120-180 gün
**Tipi:** Lumina V4 + Cloud Lab + Voice + multi-agent
**Risk Seviyesi:** YÜKSEK (kompleksite)
**Leverage Skoru:** 7/10

#### Mission

Lumina'yı chat'ten **operating layer**'a evolve etmek. Visitor'ın kendi AWS'sini bağlayabileceği Cloud Lab, repo-aware tools, 2-agent multi-agent başlangıç, voice persistent surface.

#### Strategic Outcome

Phase 4 sonunda:
- Lumina V4: persistent companion (cross-visit memory)
- Lumina V4 repo-aware: 3 new tool (readSourceFile, explainCommitRationale, diffArchitectures)
- Lumina V4.5: 2 sub-agent (architecture-critic, code-reviewer)
- Voice persistent button (her sayfada, opt-in)
- Cloud Lab MVP (visitor STS connect + scan, no remediation)
- Phase 3 monetization streams scale (lumina-chat Pro 30+ customer)
- Conference talk submission (ilk CFP gönderildi)

#### Systems Introduced

| Sistem | Tier | Kaynak |
|--------|------|--------|
| Lumina V4 persistent companion (cross-visit memory) | B | Genişletme: `lib/lumina/memory.ts` + visitor fingerprint |
| Lumina V4 repo-aware tools (3 yeni) | B | Genişletme: `lib/lumina/tools.ts` |
| Lumina V4.5 sub-agent infrastructure | B | Yeni: `lib/lumina/agents/`, router |
| Sub-agent 1: architecture-critic | B | Yeni system prompt + tool reg |
| Sub-agent 2: code-reviewer | B | Yeni system prompt + tool reg |
| Voice persistent button (per-page) | B | Genişletme: `LuminaVoice.tsx` |
| Cloud Lab MVP (STS connect + read-only scan) | B | Yeni: `/lab/cloud-scan` + `/api/cloud-scan` |
| Public Lumina brain (`/lumina/brain`) | B | Yeni: `app/lumina/brain/page.tsx` |
| Public Lumina failures (`/lumina/failures`) | B | Yeni: `app/lumina/failures/page.tsx` |
| Conference CFP draft + submission | B | External: AWS re:Invent draft hazırla |

#### Systems Postponed

- 5+ sub-agent registry — Phase 5 (2 yeterli proof)
- Voice ambient mode (wake-word) — Phase 5+
- Voice multi-language detection — Phase 5+
- CWH autonomous remediation Phase B-D — Phase 5+
- Screen-aware Lumina — Phase 5+
- Emotional adaptation (visitor type detection) — Phase 5+
- 2. Cohort iteration — Phase 5

#### Dependency Graph

```
[Lumina V2 (V3)]              ──→ [Lumina V4 persistent companion]
[GitHub API access (V3)]      ──→ [Repo-aware tools]
[Bedrock multi-step (V3)]     ──→ [Multi-agent orchestration]
[Voice infra (V3)]            ──→ [Voice persistent button]
[Telemetry (Phase 1)]         ──→ [Sub-agent eval pipelines]
[lumina-chat Pro (Phase 3)]   ──→ [V4 features ship to Pro customers first]
[Lemon Squeezy (V3)]          ──→ [Pro tier upgrades (V4 → Pro Plus)]
```

#### Revenue Impact

**Hedef Phase 4 sonu MRR:** $3K-$5K

Pro tier upgrade ile cross-sell:
- lumina-chat Pro V4 features → Pro Plus tier ($99/ay) — 15 customer hedef
- Cloud Lab demo → CWH Pro funnel boost
- Conference talk = brand authority → premium template sales artar

| Stream | Customer | Avg | MRR |
|--------|----------|-----|-----|
| lumina-chat Pro | 30 | $49 | $1,470 |
| lumina-chat Pro Plus | 15 | $99 | $1,485 |
| Premium templates | 10 sales/ay | $299 | $2,990 (variable) |
| Premium API | 15 | $99 | $1,485 |
| CWH Pro | 20 (new V4-driven) | $99 | $1,980 |
| **MRR Total** | | | **~$6,420** (template MRR dahil) |

#### Distribution Impact

**Lumina visibility:** /lumina/brain public → developer paylaşımları
**Conference:** İlk submission → 2027 talk acceptance şansı
**npm downloads:** lumina-chat hedef 1K/hafta
**YouTube:** 3. series başla (Reverse Engineering [Famous Product])

#### Maintenance Cost

| Sistem | Aylık Saat |
|--------|------------|
| Phase 3 systems ongoing | 25 |
| Sub-agent eval pipeline + drift response | 4 |
| Voice support (mic permission edge cases) | 2 |
| Cloud Lab security review (STS edge cases) | 3 |
| Conference talk prep (ayda 1 saat) | 1 |
| 3 YouTube series ongoing | 16 |
| **Toplam** | **51 saat/ay** |

**KIRMIZI ALARM:** 51 saat/ay maintenance + new feature = 60+ saat/hafta. **Sürdürülemez.**

**Mandatory scope cut Phase 4 başında:**
- YouTube 3 series → 2 series (Architecture-from-Scratch sustain, Reverse Engineering defer)
- Voice persistent button defer (Phase 5'e), sadece chat-mode voice korunur
- Sub-agent 2 (code-reviewer) Phase 4 sonu, başlangıçta 1 sub-agent yeterli

Bu cuts ile maintenance ~38 saat/ay'a düşer.

#### Implementation Risk

| Risk | Olasılık | Şiddet | Mitigasyon |
|------|----------|--------|------------|
| Multi-agent debugging cehennemi | Yüksek | Yüksek | İlk version: tek sub-agent + comprehensive logging |
| Persistent memory privacy backlash | Düşük | Yüksek | Prominent "forget me" + opt-out default |
| STS Cloud Lab security incident | Düşük | Çok Yüksek | Read-only credentials only + 60dk hard timeout + audit log |
| Voice latency degradation | Orta | Orta | Edge runtime + cached audio assets |
| Lumina V4 cost blowup | Yüksek | Yüksek | Per-visitor cost cap + alert |
| Conference talk reject | Yüksek | Düşük | Multiple submission (re:Invent + ReactConf + Disrupt) |

#### Burnout Risk

**Çok Yüksek.** Maintenance + multi-agent complexity + content. Kritik:
- Mecburi 14-gün off Phase 4 ortasında planned
- 1 sub-agent maximum başlangıçta
- Cloud Lab basit (read-only) — auto-remediation Phase 5'te

#### Rollback Plan

Her V4 Lumina feature behind feature flag (KV-tracked `v4:flag:<feature>`):
- Sorun: flag off → Lumina V2 fallback
- Cloud Lab broken: route disable + maintenance page
- Sub-agent broken: orchestrator default to single-Lumina

#### Success Criteria

- [ ] Lumina V4 persistent: 7-gün önceki konuşma referans edilir
- [ ] Repo-aware tools: 3 tool çalışıyor, eval accuracy > 90%
- [ ] Sub-agent: en az 1 sub-agent production-ready
- [ ] Voice persistent: opt-in adoption > 15%
- [ ] Cloud Lab: 100+ visitor scan tamamlamış
- [ ] /lumina/brain + /lumina/failures public
- [ ] MRR ≥ $5K (Pro + Pro Plus + templates + API + CWH)
- [ ] Conference: 3+ CFP submitted, 1+ shortlisted
- [ ] /telemetry'de tüm V4 Lumina + Cloud Lab metrikleri

#### Founder Energy Impact

**Çok Yüksek risk.** Yapılması gereken minimum:
- 2 ardışık haftada 30 saat aşılırsa scope cut
- Phase ortasında planned 14-gün off
- Phase sonunda 30-gün off (Phase 5'e geçmeden veya hiç geçmeden)

#### Leverage Score: 7/10

Lumina'yı operating layer'a çıkarır ama maintenance cost yüksek.

---

### 4.5 PHASE 5 — EXPERIMENTAL EXPANSION (CONDITIONAL)

**Süre:** 180+ gün (opsiyonel, koşullu)
**Tipi:** Tier C deneyleri, sadece metrikler tutarsa
**Risk Seviyesi:** ÇOK YÜKSEK
**Leverage Skoru:** 4-6/10 (volatile)

#### Mission

V4 vizyonunun "deep technical futures" katmanını **sadece traction destekliyorsa** ship et. Aksi takdirde Phase 4 sonu = V4 tamamlandı, sonsuz feature ekleme yapma.

#### Phase 5 Tetikleme Koşulları (Hepsi Zorunlu)

Phase 5 başlamaz, sürece bu **5 koşulun tamamı** tutmaz:

1. Phase 4 sonu MRR ≥ $5K, 6 ay boyunca devamlı
2. lumina-chat npm haftalık 1K+ download, 6 ay devamlı
3. /lab toplam 5K+ unique visitor/ay, 3 ay devamlı
4. Conference talk en az 1 accept
5. Founder energy yeşil 60 gün boyunca (burnout circuit breaker 0 trigger)

Eğer bu 5'ten 1'i bile tutmuyorsa → Phase 5 **execute edilmez**, Phase 4 systems polish + scale mode'una geçilir.

#### Strategic Outcome (Eğer Yapılırsa)

- Architecture Playground live (drag-drop AWS)
- WebGPU 3D cloud topology (Emre'nin own AWS accounts)
- lumina-chat Local Mode (WebLLM browser inference)
- Multimodal Lumina (architecture diagram upload + screen share)
- 2. Cohort iteration başlamış
- Sub-agent registry 4-5 agent

#### Systems Introduced (Conditional)

| Sistem | Tier | Koşul |
|--------|------|-------|
| Architecture Playground | C | Phase 5 tetiklenir + Visitor demand sinyali |
| WebGPU 3D topology | C | 3+ AWS account aktif (organik) |
| Local-first WebLLM | C | Privacy-conscious customer talep |
| Multimodal screen share | C | Pro Plus customer talep |
| 2. Cohort | C | 1. cohort 30+ alumni başarılı |
| Sub-agent 3-5 | C | Phase 4 sub-agent'lar production-stable |
| `/live` SSE dashboard | C | /telemetry yeterli değilse |
| Subdomain federation (lab., lumina., api.) | C | Path-based traffic > 50K/ay |

#### Critical Caveat

Phase 5 **may never execute**. V4 sonsuza kadar Phase 4'te kalabilir. Bu **başarısızlık değil** — disciplined product evolution.

#### Founder Energy Impact

**Yıkıcı.** Phase 5'e girmek = Phase 4 maintenance + yeni complexity. Tek koşulda hayatta kalabilir: Phase 5 öncesi **part-time contractor** alındı (V4 invariant: max 2 part-time).

---

## 🔧 5. SUB-PR EXECUTION MAPS

Her phase 3-6 sub-PR'a bölünür. Her sub-PR independently deployable.

### 5.1 Phase 1 — Sub-PRs (5 toplam)

#### Sub-PR 1.1 — Publish `@emredogan/lumina-chat@0.1.0` to npm
**Affected:** `packages/lumina-chat/`, `.github/workflows/publish-lumina-chat.yml`
**Risks:** İlk publish failure; provenance setup; version conflict
**Validation:**
- [ ] `npm pack --dry-run` tarball file list doğru
- [ ] GitHub repo'da `NPM_TOKEN` secret eklenmiş
- [ ] Sigstore provenance enabled
- [ ] Workflow typed-version gate çalışıyor
- [ ] Published version `npm install` ile test edildi (fresh project)
**Dependencies:** None (V3'te ready)
**Performance:** Bundle size 19.2 KB packed verified
**Mobile:** N/A (npm package)
**Rollback:** `npm deprecate @emredogan/lumina-chat@0.1.0 "Critical bug — use 0.1.1"`
**Telemetry:** `v4:adoption:lumina-chat-npm:downloads` (npm API polled hourly)

#### Sub-PR 1.2 — `/telemetry` v1 Public Dashboard
**Affected:** Yeni `app/telemetry/page.tsx`, `app/api/telemetry/[metric]/route.ts`, `lib/telemetry/`
**Risks:** KV cost explosion; visitor flood
**Validation:**
- [ ] 5+ metrik gösteriyor (Lumina p95 latency, token consumption, auto-tweet success, npm downloads, MRR placeholder)
- [ ] Edge runtime
- [ ] Cache: 5-dakika revalidate
- [ ] Lighthouse Mobile ≥ 90
- [ ] Sentry alarm threshold set
**Dependencies:** Vercel KV (mevcut), Sentry setup
**Performance:** LCP < 1.2s (cached read)
**Mobile:** Responsive grid 1-col → 2-col → 3-col
**Rollback:** Route disable, KV keys preserved
**Telemetry:** `v4:telemetry:dashboard:visits` (self-referential)

#### Sub-PR 1.3 — Auto-Tweet 2.0 Multi-Format
**Affected:** `app/api/auto-tweet/route.ts` genişletme, `vercel.json` cron
**Risks:** Duplicate content; Twitter API rate limit; Claude cost spike
**Validation:**
- [ ] 4 format: daily standup (mevcut), weekly architecture thread (yeni), "what broke today" (Sentry-triggered), Lumina answer clip
- [ ] KV-tracked content history (duplicate yasak)
- [ ] Per-format dedicated system prompt
- [ ] Per-format dedicated OG image template
- [ ] 30 gün boyunca 0 failure target
**Dependencies:** Existing Twitter creds + Sentry webhook
**Performance:** Cron < 10s execution
**Mobile:** N/A
**Rollback:** vercel.json cron remove
**Telemetry:** `v4:adoption:autotweet:success_rate:daily`

#### Sub-PR 1.4 — `/changelog` Public Engineering Log
**Affected:** Yeni `app/changelog/page.tsx`, `lib/github-events.ts` extension
**Risks:** GitHub API rate limit; commit message kalitesi düşük (WHY missing)
**Validation:**
- [ ] Son 50 commit gösteriyor
- [ ] Filter: project, tag, date
- [ ] Reverse chronological
- [ ] Lighthouse Mobile ≥ 92
- [ ] KV cache 30-dakika
**Dependencies:** GitHub Events API (V3)
**Performance:** LCP < 1.5s
**Mobile:** Card stack on mobile
**Rollback:** Route disable
**Telemetry:** `v4:telemetry:changelog:visits`

#### Sub-PR 1.5 — GitHub Sponsors + README Polish + Sentry Setup
**Affected:** Repo metadata, `README.md`, `lib/sentry.ts` (yeni dep `@sentry/nextjs`)
**Risks:** README breaking change (CI rotunu etkilerse); Sentry SDK bundle bloat
**Validation:**
- [ ] GitHub Sponsors page enabled
- [ ] README cinematic upgrade (badges, hero, feature highlights)
- [ ] Sentry SDK lazy-loaded (next/dynamic)
- [ ] Bundle delta < 10 KB
- [ ] Sentry dashboard receiving events
**Dependencies:** Personal GitHub setup, Sentry account
**Performance:** Bundle delta < 10 KB
**Mobile:** README rendering OK
**Rollback:** Sentry SDK remove, README revert
**Telemetry:** `v4:telemetry:sentry:events_per_day`

### 5.2 Phase 2 — Sub-PRs (5 toplam)

#### Sub-PR 2.1 — `/lab` Scaffold + Experiment 1 (IAM Translator)
**Affected:** Yeni `app/lab/page.tsx`, `app/lab/iam-translator/page.tsx`, `app/api/lab/iam-translate/route.ts`
**Risks:** Bedrock cost; rate limit abuse; IAM JSON parse edge cases
**Validation:**
- [ ] /lab index page 1 experiment (IAM) live, 2 "coming soon" placeholder
- [ ] /lab/iam-translator: paste IAM JSON → streaming Claude analysis
- [ ] Per-IP rate limit (5/saat)
- [ ] Per-day cost cap ($5 hard)
- [ ] Lighthouse Mobile ≥ 90
**Dependencies:** Bedrock client (V3), `/api/cwh-demo` pattern (V3)
**Performance:** LCP < 1.5s
**Mobile:** Textarea + button mobile-friendly
**Rollback:** Route disable; experiment marked "archived"
**Telemetry:** `v4:adoption:lab:iam:visits_daily`, `v4:cost:lab:iam:usd_daily`

#### Sub-PR 2.2 — Experiment 2: Prompt Rescuer
**Affected:** Yeni `app/lab/prompt-rescuer/page.tsx`, `app/api/lab/prompt-rescue/route.ts`
**Risks:** Aynı 2.1
**Validation:** Aynı pattern; vague prompt → senior-grade brief
**Dependencies:** VibingCoderAI logic patterns (existing project)
**Telemetry:** `v4:adoption:lab:prompt-rescuer:visits_daily`

#### Sub-PR 2.3 — Experiment 3: Commit Narrator
**Affected:** Yeni `app/lab/commit-narrator/page.tsx`, `app/api/lab/narrate-commits/route.ts`
**Risks:** GitHub API rate limit (visitor's repo URL)
**Validation:** Repo URL input → commit list + WHY annotation suggestions
**Dependencies:** GitHub Octokit (yeni dep, ~25KB)
**Telemetry:** `v4:adoption:lab:commit-narrator:visits_daily`

#### Sub-PR 2.4 — `@emredogan/cli` v0.1 npm Package
**Affected:** Yeni `packages/emredogan-cli/`, GitHub Actions publish workflow (copy 1.1)
**Risks:** Cross-platform (Windows ESM); Node version compatibility
**Validation:**
- [ ] `npx emredogan browse` opens portfolio
- [ ] `npx emredogan ask "..."` terminal Lumina
- [ ] `npx emredogan project list` reads `data/projects.ts`
- [ ] POSIX-only (Windows defer)
- [ ] Bundle: <100 KB
**Dependencies:** Lumina chat API endpoint, `data/projects.ts`
**Performance:** Install <5s on broadband
**Mobile:** N/A
**Rollback:** `npm deprecate`
**Telemetry:** `v4:adoption:emredogan-cli:downloads_weekly`

#### Sub-PR 2.5 — Notes 2.0 Audio + Interactive Diagrams
**Affected:** `data/notes.ts` schema extension, yeni `lib/notes-audio.ts`, `components/notes/AudioPlayer.tsx`, `components/notes/InteractiveDiagram.tsx`
**Risks:** TTS cost (per-note ~$0.10); diagram complexity
**Validation:**
- [ ] En az 1 note 3+ format (longform + audio + diagram)
- [ ] Audio build-time generated (cron rebuild)
- [ ] Diagram: react-flow inline (Phase 2'de dep yoksa eklenir — ~50KB)
- [ ] Tabbed UI: Read / Listen / Diagram
**Dependencies:** `/api/voice/tts` (V3)
**Performance:** Notes page LCP < 1.5s
**Mobile:** Tabs mobile-responsive
**Rollback:** Schema fields optional; UI tab hide
**Telemetry:** `v4:adoption:notes:audio_plays`, `v4:adoption:notes:diagram_interactions`

### 5.3 Phase 3 — Sub-PRs (6 toplam)

#### Sub-PR 3.1 — lumina-chat Pro Managed Backend
**Affected:** Yeni route group `app/(pro)/` veya separate Vercel project, billing integration
**Risks:** Backend reliability; multi-tenant data isolation; billing edge cases
**Validation:**
- [ ] Customer signup → API key generated
- [ ] Customer dashboard: usage, billing, settings
- [ ] Per-customer KV isolation
- [ ] Lemon Squeezy webhook → KV state sync
- [ ] Cancel flow → key disabled
**Dependencies:** Lemon Squeezy (V3), Vercel KV
**Performance:** Pro dashboard LCP < 2s
**Mobile:** Dashboard mobile-friendly
**Rollback:** Service maintenance page; existing customers credited
**Telemetry:** `v4:monetization:lumina-chat-pro:mrr`, `v4:monetization:lumina-chat-pro:churn`

#### Sub-PR 3.2 — Premium Template: cwh-saas-starter
**Affected:** Yeni `packages/templates/cwh-saas-starter/`
**Risks:** Template kalitesi düşük → kötü review; support burden
**Validation:**
- [ ] Fork-and-deploy: tek README adımı
- [ ] Lemon Squeezy + KV + Bedrock + Resend pre-wired
- [ ] Lighthouse 95+ out-of-box
- [ ] Documentation: 5-min quickstart
- [ ] Lemon Squeezy product listing live
**Dependencies:** CWH architecture pattern (own project)
**Performance:** N/A
**Mobile:** Template includes mobile-ready hero
**Rollback:** Listing pause; existing buyers keep access
**Telemetry:** `v4:monetization:templates:sales_total`, `v4:monetization:templates:support_tickets`

#### Sub-PR 3.3 — Premium API: `/v1/lumina/chat` with Key Auth
**Affected:** Yeni `app/api/v1/lumina/chat/route.ts`, `lib/api-auth.ts`
**Risks:** Cost abuse; key leak
**Validation:**
- [ ] API key auth (header `X-API-Key`)
- [ ] Per-key rate limit (tier-based)
- [ ] Per-key daily cost cap
- [ ] Audit log (anonymized)
- [ ] OpenAPI spec auto-generated
- [ ] Public docs at `/api/v1/docs`
**Dependencies:** Phase 3.1 (Pro signup generates key)
**Performance:** TTFB < 200ms warm
**Mobile:** N/A
**Rollback:** Disable endpoint, refund affected keys
**Telemetry:** `v4:monetization:api:requests_per_key`, `v4:cost:api:usd_daily`

#### Sub-PR 3.4 — Discord Setup + Contributor Docs
**Affected:** External Discord, repo `CONTRIBUTING.md`
**Risks:** Time sink; moderation burden
**Validation:**
- [ ] Discord server setup with #help, #contributors, #lumina-failures channels
- [ ] Invite link in lumina-chat README
- [ ] CONTRIBUTING.md prescriptive
- [ ] Issue templates GitHub'da
- [ ] Code of Conduct
**Dependencies:** None
**Performance:** N/A
**Mobile:** Discord mobile app
**Rollback:** Pause invitations
**Telemetry:** `v4:adoption:discord:members`, `v4:adoption:discord:weekly_active`

#### Sub-PR 3.5 — Newsletter Weekly Digest (Resend)
**Affected:** Yeni `app/api/newsletter/route.ts`, `app/newsletter/page.tsx`, `lib/newsletter.ts`
**Risks:** Open rate düşük; unsubscribe surge; deliverability
**Validation:**
- [ ] Signup form Footer'da
- [ ] Confirmation email (double opt-in)
- [ ] Weekly cron drafts digest from `/changelog` + new notes + lumina insights
- [ ] Unsubscribe link footer
- [ ] CAN-SPAM compliance
**Dependencies:** Resend (V3)
**Performance:** Subscribe submit < 1s
**Mobile:** Form mobile-friendly
**Rollback:** Cron pause; signup form disable
**Telemetry:** `v4:adoption:newsletter:subscribers`, `v4:adoption:newsletter:open_rate`

#### Sub-PR 3.6 — Clip Extraction Pipeline (Semi-Auto)
**Affected:** Yeni `scripts/clip-extractor/` (ffmpeg + Lumina best-answer detection), `app/admin/clips/page.tsx` (approval UI)
**Risks:** Video quality; manual approval bottleneck
**Validation:**
- [ ] Lumina best answer detected weekly (satisfaction signal)
- [ ] ffmpeg renders 30-saniye clip
- [ ] Admin UI for Emre approval
- [ ] Approved clip → Twitter v1.1 media upload
**Dependencies:** Twitter media upload (V3)
**Performance:** Render <60s
**Mobile:** Admin desktop-only OK
**Rollback:** Cron disable
**Telemetry:** `v4:distribution:clips:posted_weekly`

### 5.4 Phase 4 — Sub-PRs (5 toplam)

#### Sub-PR 4.1 — Lumina V4 Persistent Companion (Cross-Visit Memory)
**Affected:** `lib/lumina/memory.ts` extension, `components/chat/LuminaWindow.tsx` hydration
**Risks:** Privacy backlash; fingerprint stability
**Validation:**
- [ ] Visitor fingerprint anonymous + opt-in
- [ ] Prominent "forget me" link
- [ ] Cross-visit memory 90-gün TTL
- [ ] Topic graph derived from past conversations
- [ ] Returning visitor greeted with last topic
**Dependencies:** Vercel KV
**Performance:** Hydration <100ms
**Mobile:** Same UI, no extra cost
**Rollback:** Feature flag disable; memory reverts to per-session
**Telemetry:** `v4:adoption:lumina-memory:returning_visitor_rate`

#### Sub-PR 4.2 — Lumina V4 Repo-Aware Tools (3 yeni)
**Affected:** `lib/lumina/tools.ts` extension
**Risks:** GitHub API rate limit; source code privacy (eğer private repo'lar varsa)
**Validation:**
- [ ] `readSourceFile(path)` tool çalışıyor
- [ ] `explainCommitRationale(sha)` tool çalışıyor
- [ ] `diffArchitectures(idA, idB)` tool çalışıyor
- [ ] Tool eval accuracy > 90%
- [ ] Public-only repos (private hariç tutulur)
**Dependencies:** GitHub Octokit (Phase 2.3)
**Performance:** Tool execution < 1s
**Mobile:** Same chat UI
**Rollback:** Tools disabled, fallback to V2 tools
**Telemetry:** `v4:adoption:repo-aware-tools:calls`

#### Sub-PR 4.3 — Lumina V4.5 Sub-Agent Infrastructure + Sub-Agent 1
**Affected:** Yeni `lib/lumina/agents/`, `lib/lumina/router.ts`, `lib/lumina/agents/architecture-critic.ts`
**Risks:** Multi-agent debugging; latency increase
**Validation:**
- [ ] Router dispatches based on intent
- [ ] architecture-critic agent çalışıyor
- [ ] Public system prompt (`/lumina/brain/architecture-critic`)
- [ ] Eval pipeline per agent
- [ ] Single Lumina hala default
**Dependencies:** Phase 4.1, 4.2
**Performance:** Latency p95 < 3s (slight increase OK)
**Mobile:** Same UI, transparent to user
**Rollback:** Router fallback to single Lumina
**Telemetry:** `v4:adoption:sub-agent:architecture-critic:invocations`

#### Sub-PR 4.4 — Voice Persistent Button (Per-Page)
**Affected:** New `components/chat/LuminaVoicePersistent.tsx`, layout integration
**Risks:** Mic permission UX; latency
**Validation:**
- [ ] Persistent voice button on every page (mobile + desktop)
- [ ] Opt-in voice mode (no wake-word)
- [ ] Voice mode triggers LuminaWindow open
- [ ] Reduced-motion graceful
- [ ] Safe-area-aware position
**Dependencies:** Voice infra (V3)
**Performance:** Idle 0% CPU
**Mobile:** Mic button mobile-optimized
**Rollback:** Component remove, voice only in chat
**Telemetry:** `v4:adoption:voice:opt_in_rate`

#### Sub-PR 4.5 — Cloud Lab MVP (Visitor STS Connect + Scan)
**Affected:** Yeni `app/lab/cloud-scan/page.tsx`, `app/api/cloud-scan/route.ts`, `lib/aws-sts-client.ts`
**Risks:** **Security** (en yüksek risk); cost; cross-account edge cases
**Validation:**
- [ ] CloudFormation template generated for visitor
- [ ] Visitor pastes IAM Role ARN
- [ ] STS AssumeRole → temporary credentials (60-dakika max)
- [ ] Read-only scan only (no writes, no remediation)
- [ ] Comprehensive audit log
- [ ] Scan results streamed via Lumina chat
- [ ] Security review: external pentester (mandatory before launch)
**Dependencies:** AWS SDK client-sts, Bedrock client
**Performance:** Scan completion < 60s for typical account
**Mobile:** Form mobile-responsive; results in chat
**Rollback:** Route disable, all credentials wiped
**Telemetry:** `v4:adoption:cloud-lab:scans_completed`, `v4:security:cloud-lab:audit_log_size`

### 5.5 Phase 5 — Sub-PRs (Koşullu, Listed but not detailed)

Phase 5 sub-PR'ları bu doc'ta detaylanmaz çünkü execute edileceği belirsiz. **Eğer** Phase 5 tetiklenirse, o noktada V4 EXECUTION SYSTEM v2.0 yazılır.

İhtimal sub-PR listesi:
- 5.1: Architecture Playground (react-flow drag-drop + cost projector)
- 5.2: WebGPU 3D cloud topology
- 5.3: lumina-chat Local Mode (WebLLM browser inference)
- 5.4: Multimodal Lumina (architecture diagram upload — Claude Vision)
- 5.5: Sub-agent 2-3 (code-reviewer, opportunity-scout)
- 5.6: 2. Cohort iteration

---

## 🤖 6. CLAUDE CLI IMPLEMENTATION PROMPTS

Her phase için **copy-paste ready** prompt. Agent başlayacağı zaman ilgili prompt'u açar, içeriği kopyalar, yapıştırır.

### 6.1 PHASE 1 PROMPT — OSS Launch & Distribution Foundation

```
==============================================
PHASE 1 — OSS LAUNCH & DISTRIBUTION FOUNDATION
Hedef Süre: 60-90 gün
Risk Seviyesi: DÜŞÜK
Leverage Skoru: 9/10
==============================================

## A. PRE-SCAN (ZORUNLU — atlama YOK)

Aşağıdaki adımları SIRAYLA yürüt. Her adımdan sonra
ne öğrendiğini tek cümlede özetle:

1. Read PORTFOLYO_V4_EXECUTION_SYSTEM.md tamamen — özellikle:
   - Bölüm 1 (Execution Philosophy)
   - Bölüm 2 (Global Engineering Laws)
   - Bölüm 4.1 (Phase 1 architecture)
   - Bölüm 5.1 (Phase 1 sub-PR maps)
   - Bölüm 8 (Anti-patterns)
   - Bölüm 10 (System termination rules)

2. Read PORTFOLYO_V4_FUTURE_SYSTEMS.md ilgili bölümler:
   - Section 4 (Global Distribution Systems) — Phase 1 distribution
   - Section 6 (Deep Technical Futures, §6.1) — telemetry stack

3. Read PORTFOLYO_V3_EXECUTION_SYSTEM.md Phase 4 (Recognition Layer)
   — Phase 1 V3'ün uzantısı.

4. Confirm baseline:
   ```bash
   git status                                              # clean tree
   git log --oneline -10                                  # son commit'ler
   npm run build                                          # yeşil baseline
   npx tsc --noEmit                                       # type-check temiz
   ls packages/lumina-chat/dist/                          # build artifact var
   ls .github/workflows/publish-lumina-chat.yml          # publish workflow var
   ```

5. Read ve özetle aşağıdakileri (her biri 1 cümle):
   - packages/lumina-chat/package.json (version 0.1.0?)
   - packages/lumina-chat/README.md (badges + quickstart yerinde mi?)
   - .github/workflows/publish-lumina-chat.yml (workflow ready mi?)
   - app/api/auto-tweet/route.ts (mevcut cron logic)
   - app/api/cwh/live-metrics/route.ts (KV metric pattern referansı)
   - lib/lumina/memory.ts (KV key pattern referansı)
   - vercel.json (cron schedule)

6. Confirm Vercel environment variables (Vercel dashboard):
   - KV_REST_API_URL ✓
   - KV_REST_API_TOKEN ✓
   - ANTHROPIC_API_KEY ✓
   - TWITTER_API_KEY + secrets ✓
   - LEMON_SQUEEZY_API_KEY ✓
   - YENİ: NPM_TOKEN (Phase 1 sub-PR 1.1 için)
   - YENİ: SENTRY_DSN (Phase 1 sub-PR 1.5 için)

7. Bash: `git checkout main && git pull` → branch hazır
8. Bash: `git checkout -b feat/v4-phase1-oss-launch`

PRE-SCAN ÖZET ÖRNEK:
"V3 4-phase tamamlandı, lumina-chat dist/ ready, publish workflow
configured, auto-tweet V3 cron çalışıyor, KV pattern lib/lumina/
memory.ts'te referans, npm publish için NPM_TOKEN ve Sentry için
SENTRY_DSN eklenecek, branch feat/v4-phase1-oss-launch hazır."

## B. IMPLEMENTATION ORDER

Sub-PR sırası — her sub-PR ship + 5-7 gün observation + sonraki:

### SUB-PR 1.1: lumina-chat npm publish (1-2 gün)

1. NPM_TOKEN secret repo'ya eklendi mi confirm
2. packages/lumina-chat/package.json version 0.1.0 confirm
3. `cd packages/lumina-chat && npm run build && npm pack --dry-run`
   → tarball file list inceleme (LICENSE + README.md + dist/* hepsi var mı)
4. Eğer file list eksikse: `files` field düzelt
5. GitHub Actions UI → "Publish @emredogan/lumina-chat" workflow
   → Run with version="0.1.0", tag="latest"
6. Workflow runs: build → pack dry-run → publish with provenance
7. Verify: `npm view @emredogan/lumina-chat` → 0.1.0 visible
8. Fresh project test:
   ```bash
   cd /tmp && mkdir lumina-test && cd lumina-test
   npm init -y && npm install @emredogan/lumina-chat
   ```
9. Update homepage README badge URLs (npm version, downloads)

Commit ladder:
- `phase4-v4: bump lumina-chat to 0.1.0 for npm publish`
- `phase4-v4: publish @emredogan/lumina-chat@0.1.0 to npm`
- `phase4-v4: add npm badges to portfolio README`

PR1 close: `phase4-v4: ship lumina-chat npm public launch (sub-pr 1.1)`

### SUB-PR 1.2: /telemetry v1 dashboard (3-4 gün)

1. Schema design — KV key pattern:
   - `v4:telemetry:lumina:p95_latency:hourly` (rolling)
   - `v4:cost:bedrock:daily:USD` (cumulative)
   - `v4:adoption:autotweet:success:30d`
   - `v4:adoption:lumina-chat-npm:weekly`
   - `v4:monetization:mrr:current` (placeholder, $0 ilk)

2. Lib: `lib/telemetry/metrics.ts` — helper functions
   ```ts
   export async function recordMetric(key: string, value: number)
   export async function readMetric(key: string): Promise<number | null>
   ```

3. Edge route: `app/api/telemetry/[metric]/route.ts`
   - Whitelist of metric names
   - KV read with 5-dakika cache
   - JSON response: { metric, value, updated_at }

4. Page: `app/telemetry/page.tsx` (Server Component)
   - Parallel fetch 5+ metrik
   - Grid 1-col mobile → 3-col desktop
   - Cyan accent on values
   - "Last updated: X seconds ago" per metric

5. Integration: existing auto-tweet route'a metric recording ekle:
   ```ts
   await recordMetric('v4:adoption:autotweet:success:30d', 1);
   ```

6. Integration: Lumina chat route'a latency recording:
   ```ts
   const start = Date.now();
   // ... existing logic
   await recordMetric('v4:telemetry:lumina:p95_latency:hourly', Date.now() - start);
   ```

7. Test:
   - curl http://localhost:3000/api/telemetry/lumina-p95 → JSON
   - Visit /telemetry → 5 metrik render

Commit ladder:
- `phase4-v4: scaffold telemetry KV schema + helper lib`
- `phase4-v4: add /api/telemetry/[metric] edge endpoint`
- `phase4-v4: add /telemetry public dashboard page`
- `phase4-v4: wire auto-tweet + lumina chat to telemetry recording`

PR1.2 close: `phase4-v4: ship public telemetry dashboard (sub-pr 1.2)`

### SUB-PR 1.3: Auto-Tweet 2.0 multi-format (5-7 gün)

1. Schema design — KV content history:
   - `v4:autotweet:history:<date>` — list of recent tweets
   - `v4:autotweet:format:<format>:last_post` — timestamp
   - Dedupe: aynı içerik 14 gün boyunca tekrar yasak

2. Refactor `app/api/auto-tweet/route.ts`:
   - Mevcut "daily standup" logic mode="daily_standup"
   - Yeni mode'lar: "weekly_architecture", "incident_response", "lumina_clip"
   - Mode selection: cron path param ya da request body
   - Per-mode system prompt (lib/auto-tweet/prompts/<mode>.ts)
   - Per-mode OG image template

3. New cron jobs in `vercel.json`:
   ```json
   {
     "crons": [
       { "path": "/api/auto-tweet?mode=daily", "schedule": "0 6 * * *" },
       { "path": "/api/auto-tweet?mode=weekly_arch", "schedule": "0 8 * * 2" }
     ]
   }
   ```

4. Incident response: Sentry webhook → /api/auto-tweet?mode=incident
   - Only fires for "critical" severity
   - Drafted, requires manual approval (admin UI)

5. Lumina clip: weekly cron picks best Lumina answer
   - Eval signal: copy button pressed + follow-up positive
   - Render text-to-video via ffmpeg (Phase 3.6 pattern preview)
   - Phase 1'de just text post, video Phase 3.6'da

Commit ladder:
- `phase4-v4: refactor auto-tweet route for multi-format support`
- `phase4-v4: add weekly architecture thread cron`
- `phase4-v4: add incident response auto-tweet hook (Sentry-triggered)`
- `phase4-v4: add Lumina best-answer text post (clip pipeline Phase 3.6)`
- `phase4-v4: enforce duplicate content prevention in autotweet KV`

PR1.3 close: `phase4-v4: ship auto-tweet 2.0 multi-format engine (sub-pr 1.3)`

### SUB-PR 1.4: /changelog public engineering log (2-3 gün)

1. Lib: `lib/github-events.ts` extension — getRecentCommits with WHY parse
2. Page: `app/changelog/page.tsx` (Server Component)
   - GitHub Events API + KV cache (30-dk)
   - Last 50 commits
   - Filter by project (path-based)
   - Reverse chronological
   - "WHY" extracted from commit body (first paragraph after blank line)

3. Mobile: card stack
4. SEO: `generateMetadata` + canonical URL

Commit ladder:
- `phase4-v4: extend lib/github-events for WHY annotation parsing`
- `phase4-v4: add /changelog public engineering log page`
- `phase4-v4: add project + tag filter to changelog`

PR1.4 close: `phase4-v4: ship public engineering changelog (sub-pr 1.4)`

### SUB-PR 1.5: GitHub Sponsors + README polish + Sentry (1-2 gün)

1. GitHub Sponsors setup (manual, repo settings):
   - .github/FUNDING.yml ekle
   - github: emredogan-cloud

2. README polish:
   - Cinematic hero (ASCII art + tagline)
   - Badges: npm version, license, Lighthouse score, GitHub Sponsors
   - Feature highlights (Lumina, /lab, /architecture)
   - Sponsor CTA at bottom

3. Sentry setup:
   - `npm install @sentry/nextjs`
   - `npx @sentry/wizard@latest -i nextjs`
   - SENTRY_DSN env var
   - Sentry SDK lazy-loaded (next/dynamic'le client-side)
   - Bundle delta confirm <10KB

4. Sentry integration:
   - Lumina chat route'a error capture
   - Auto-tweet route'a error capture
   - /lab route'lar (Phase 2'de gelir)

Commit ladder:
- `phase4-v4: enable GitHub Sponsors via FUNDING.yml`
- `phase4-v4: cinematic README polish with badges + sponsor cta`
- `phase4-v4: integrate Sentry error tracking with lazy SDK load`

PR1.5 close: `phase4-v4: ship GitHub Sponsors + README + Sentry (sub-pr 1.5)`

## C. QUALITY CONTROL

Phase 1 final QC (tüm sub-PR ship sonrası):

(a) Build green:
```
npx tsc --noEmit
npm run build
```

(b) Lighthouse audit her route (Mobile):
- / ≥ 92
- /about ≥ 92
- /notes ≥ 92
- /telemetry ≥ 90 (interactive)
- /changelog ≥ 90

(c) Telemetry verify:
- /telemetry'de 5+ metrik canlı
- Refresh otomatik (5 dakika)
- KV cost projected < $5/ay

(d) npm publish verify:
- `npm view @emredogan/lumina-chat` → 0.1.0
- Fresh install test passed
- Provenance badge visible on npm page

(e) Auto-tweet 2.0 verify:
- Cron schedule active (vercel.json)
- 7-gün observation: 0 failure, 0 duplicate

(f) Sentry verify:
- Dashboard receiving events
- Alarm rule set: critical → email Emre

(g) GitHub Sponsors verify:
- Sponsors page live (github.com/emredogan-cloud/sponsors)
- README badges render

(h) Reduced-motion test (DevTools):
- /telemetry hala kullanılabilir
- /changelog hala render

(i) Mobile manual test (Pixel 5 emulation):
- Tüm yeni route'lar tap-target OK
- Safe-area-inset OK (Phase 4 V3 carry-over)

## D. GIT DİSCİPLİNE

Branch: `feat/v4-phase1-oss-launch`

5 sub-PR — independent merge:
- PR1.1 → main (lumina-chat publish)
- PR1.2 → main (telemetry)
- PR1.3 → main (auto-tweet 2.0)
- PR1.4 → main (/changelog)
- PR1.5 → main (Sponsors + README + Sentry)

Her PR independent deployable. Per-PR observation 5-7 gün.

Commit prefix: `phase4-v4:` (Phase 4 V3 sonu + V4 başı continuity)
Per-step commit. Per-PR close marker.

Final phase close:
- `phase4-v4: complete — phase 1 OSS launch foundation`
- Push, deploy, 30-gün observation.

## E. FINAL VALIDATION

Phase 1 production-readiness checklist:

- [ ] npm: `@emredogan/lumina-chat@0.1.0` installable
- [ ] npm: provenance badge visible
- [ ] /telemetry: 5+ metrik live
- [ ] /telemetry: Lighthouse Mobile ≥ 90
- [ ] Auto-tweet 2.0: 7-gün 0 failure
- [ ] /changelog: 50+ commit visible
- [ ] GitHub Sponsors: enabled, page live
- [ ] Sentry: receiving events, alarm set
- [ ] All 6 cron tasks scheduled (1 existing + 2 new = vercel.json updated)
- [ ] Bundle delta < 25 KB initial gz (telemetry + sentry)
- [ ] No console.log in production code
- [ ] No TODO/FIXME added (baseline'dan büyük olmamalı)
- [ ] Lumina V2 hala çalışıyor (regression yok)
- [ ] Cinematic identity korunmuş (#00d2ff only, Geist only, bg-black)
- [ ] Founder energy: 22 saat/hafta sürdürülebilir
- [ ] Burnout circuit breaker: 0 trigger Phase boyunca

Cross-phase invariants verify:
- [ ] V3 cinematic identity korunmuş
- [ ] V3 Lumina onboarding değişmemiş
- [ ] V3 bento layout aynı
- [ ] V3 token system aktif

PR merge → deploy → production smoke test → Phase 1 closed.
Phase 2'ye 30-gün observation sonrası geçilir.

==============================================
PHASE 1 SON.
==============================================
```

---

### 6.2 PHASE 2 PROMPT — Public Engineering Laboratory

```
==============================================
PHASE 2 — PUBLIC ENGINEERING LABORATORY
Hedef Süre: 90-120 gün
Risk Seviyesi: ORTA
Leverage Skoru: 8/10
==============================================

ÖN KOŞUL: Phase 1 deploy edilmiş, 30 gün observation, telemetry
yeşil, lumina-chat npm 100+ haftalık download, founder energy
yeşil. Aksi takdirde Phase 2 BAŞLATILMAZ.

## A. PRE-SCAN

1. Read PORTFOLYO_V4_EXECUTION_SYSTEM.md:
   - Bölüm 4.2 (Phase 2 architecture)
   - Bölüm 5.2 (Phase 2 sub-PR maps)
   - Bölüm 8 (Anti-patterns — özellikle "cool demo syndrome")

2. Read PORTFOLYO_V4_FUTURE_SYSTEMS.md:
   - §2.2 (Public Engineering Laboratory)
   - §2.3 (Cloud Lab — Phase 4'te, ama referans)
   - §3 (Lumina V4/V5) — Lumina Phase 4'te, Phase 2'de Lumina değişmez

3. Confirm Phase 1 metrics:
   - lumina-chat npm: 100+ haftalık download
   - /telemetry: 30-gün uptime ≥ 99%
   - Auto-tweet 2.0: 0 failure 30-gün
   - YouTube: 100+ subscriber
   - Founder energy: yeşil (haftalık ≤ 22 saat 30 gün boyunca)

4. Confirm financial constraints:
   - AWS Bedrock cost monthly: <$50 (lab experiments cost'u artıracak)
   - Lemon Squeezy account ready (Phase 3 öncesi sandbox test)
   - Sentry quota: <50% (Phase 2 yeni error volume olabilir)

5. Environment vars:
   - YENİ Phase 2: GITHUB_PAT_PUBLIC_REPOS (Octokit, lab/commit-narrator için)
   - YENİ Phase 2: NPM_TOKEN (emredogan-cli publish için; aynı token)

6. Bash: `git checkout main && git pull`
7. Bash: `git checkout -b feat/v4-phase2-public-lab`

## B. IMPLEMENTATION ORDER

5 sub-PR, sırayla.

### SUB-PR 2.1: /lab scaffold + Experiment 1 IAM Translator (5-7 gün)

1. Route scaffold:
   - app/lab/page.tsx (index — list of experiments)
   - app/lab/[slug]/page.tsx (dynamic — generic experiment frame)
   - app/lab/_components/ExperimentFrame.tsx (shared chrome)

2. Index page (`/lab`):
   - 3 experiment card (1 live, 2 "coming soon")
   - Each card: name, description, status badge (active/coming-soon/archived)
   - Lumina-narrated intro paragraph

3. Experiment 1: `/lab/iam-translator`
   - Server Component shell + Client Component for textarea/streaming
   - Pre-filled with over-permissive admin IAM policy
   - "Analyze" button → POST /api/lab/iam-translate
   - Streaming response display (existing CWHSandbox pattern reuse)
   - "Try with your own policy" CTA

4. API: `/api/lab/iam-translate/route.ts`
   - Edge runtime
   - Per-IP rate limit (5/saat, KV-tracked)
   - Daily cost cap ($5 hard, alarm + auto-disable)
   - Bedrock client (V3 lib/bedrock-client.ts)
   - System prompt: lib/lab/prompts/iam-translate.ts

5. Telemetry hooks:
   - `v4:adoption:lab:iam:visits_daily`
   - `v4:adoption:lab:iam:completions_daily`
   - `v4:cost:lab:iam:usd_daily`

6. /telemetry'ye yeni metrik kartı ekle

Commit ladder:
- `phase4-v4: scaffold /lab route and ExperimentFrame component`
- `phase4-v4: add /lab index page with experiment listings`
- `phase4-v4: add /lab/iam-translator experiment + sandbox UI`
- `phase4-v4: add /api/lab/iam-translate edge route with rate limit`
- `phase4-v4: wire iam-translator telemetry`

PR2.1 close: `phase4-v4: ship /lab scaffold + iam-translator experiment (sub-pr 2.1)`

### SUB-PR 2.2: Experiment 2 Prompt Rescuer (3-4 gün)

1. Reuse experiment frame pattern from 2.1
2. /lab/prompt-rescuer + /api/lab/prompt-rescue
3. System prompt: VibingCoderAI pattern (existing project for reference)
4. Per-IP rate limit + cost cap (aynı 2.1 pattern)
5. Update /lab index: "active" badge

Commit ladder:
- `phase4-v4: add /lab/prompt-rescuer experiment`
- `phase4-v4: add /api/lab/prompt-rescue route`

PR2.2 close: `phase4-v4: ship prompt rescuer experiment (sub-pr 2.2)`

### SUB-PR 2.3: Experiment 3 Commit Narrator (4-5 gün)

1. `npm install @octokit/rest` (dev dep; tree-shake import)
2. /lab/commit-narrator UI: GitHub repo URL input
3. /api/lab/narrate-commits:
   - Validate URL (must be public github.com)
   - Octokit: get last 20 commits
   - For each commit without good message body: draft WHY annotation via Claude
   - Stream back
4. Per-IP rate limit (3/saat — more expensive)
5. /lab index update

Commit ladder:
- `phase4-v4: install Octokit for GitHub API access`
- `phase4-v4: add /lab/commit-narrator experiment`
- `phase4-v4: add /api/lab/narrate-commits route`

PR2.3 close: `phase4-v4: ship commit narrator experiment (sub-pr 2.3)`

### SUB-PR 2.4: @emredogan/cli v0.1 npm publish (7-10 gün)

1. Create `packages/emredogan-cli/`:
   - package.json (bin: emredogan)
   - src/cli.ts (commander or yargs)
   - src/commands/ (browse, ask, project, demo)
   - tsconfig.json (similar to lumina-chat)

2. Commands:
   - `emredogan browse` — opens portfolio in default browser (`open` cmd)
   - `emredogan ask "<question>"` — POST /api/chat, stream response to terminal
   - `emredogan project list` — fetch /api/projects (yeni public endpoint, basit JSON)
   - `emredogan demo <name>` — opens /lab/<name> in browser

3. Auth: anonymous, device fingerprint via os.hostname() + random nonce

4. Add publish workflow:
   - Copy `.github/workflows/publish-lumina-chat.yml` → `publish-emredogan-cli.yml`
   - Update workspace name + paths

5. POSIX-only (Windows defer to v0.2)

6. README'de install snippet:
   ```
   npx emredogan ask "How do you handle reduced motion?"
   ```

Commit ladder:
- `phase4-v4: scaffold packages/emredogan-cli workspace`
- `phase4-v4: add cli commands: browse, ask, project, demo`
- `phase4-v4: add emredogan-cli publish workflow`
- `phase4-v4: publish @emredogan/cli@0.1.0 to npm`

PR2.4 close: `phase4-v4: ship @emredogan/cli v0.1 (sub-pr 2.4)`

### SUB-PR 2.5: Notes 2.0 audio + interactive diagrams (5-7 gün)

1. `data/notes.ts` schema extension:
   - formats: { longform, audio?, diagram? }
2. Lib: `lib/notes-audio.ts`:
   - Build-time: for each note, generate audio via /api/voice/tts
   - Output: public/notes/audio/<slug>.mp3
   - Cron: `/api/notes/regenerate-audio` (weekly)
3. Component: `components/notes/AudioPlayer.tsx` (HTML5 audio + waveform skeleton)
4. Component: `components/notes/InteractiveDiagram.tsx`:
   - react-flow render
   - Per-note diagram defined in note's MDX or data file
   - `npm install reactflow` (~50KB dep)
5. Update notes page UI:
   - Tabs: Read / Listen / Diagram
6. Apply to existing 3 notes:
   - cloud-waste-hunter-architecture: longform + audio + diagram
   - monk-mode: longform + audio
   - sixpack-ai-pose-detection: longform + audio + diagram

Commit ladder:
- `phase4-v4: extend Note schema for multi-format support`
- `phase4-v4: add lib/notes-audio build-time TTS pipeline`
- `phase4-v4: add AudioPlayer + InteractiveDiagram components`
- `phase4-v4: add tab UI to notes/[slug] page`
- `phase4-v4: enrich 3 existing notes with audio + diagram formats`

PR2.5 close: `phase4-v4: ship notes 2.0 multi-format publishing (sub-pr 2.5)`

## C. QUALITY CONTROL

(a) Build + type-check + lighthouse pattern (Phase 1 ile aynı)

(b) Lab cost monitoring:
- 7-gün observation
- Per-experiment cost <$3/gün
- Eğer aşarsa: rate limit tighten

(c) Octokit API rate limit verify (GitHub max 5K req/saat for authenticated)

(d) emredogan-cli fresh install test:
```bash
npx @emredogan/cli ask "test"
```

(e) Notes 2.0 audio verify: 3 note için audio dosyaları public/ altında

(f) /lab adoption smoke test:
- /lab index'i Twitter'a paylaş, 24 saat içinde 10+ visit hedef

## D. GIT DİSCİPLİNE

Branch: `feat/v4-phase2-public-lab`
5 sub-PR.
Per-step commit. Per-PR observation 7 gün.
Phase close: `phase4-v4: complete — phase 2 public lab launched`

## E. FINAL VALIDATION

- [ ] /lab live, 3 experiment çalışıyor
- [ ] Her experiment cost cap çalışıyor (test edildi)
- [ ] `npx @emredogan/cli` works (POSIX)
- [ ] Notes 2.0: 3 note 3+ format
- [ ] /telemetry'de lab adoption metrics live
- [ ] Lighthouse Mobile her route ≥ 90
- [ ] Cost monthly < $80 (Bedrock + Whisper + ElevenLabs combined)
- [ ] Founder energy yeşil (≤22 saat/hafta)
- [ ] V3 + V4 Phase 1 hiçbir regression
- [ ] Cinematic identity korunmuş

Phase 2 closed. Phase 3'e 60-gün observation sonrası geçilir.

==============================================
PHASE 2 SON.
==============================================
```

---

### 6.3 PHASE 3 PROMPT — Monetization & Community Layer

```
==============================================
PHASE 3 — MONETIZATION & COMMUNITY LAYER
Hedef Süre: 90-120 gün
Risk Seviyesi: ORTA-YÜKSEK
Leverage Skoru: 8/10
==============================================

ÖN KOŞUL: Phase 2 deployed, 60-gün observation:
- /lab traffic: 1K+ unique/ay aktif
- lumina-chat npm: 300+ haftalık DL
- emredogan-cli npm: 50+ haftalık DL
- Founder energy: yeşil 60 gün
Aksi takdirde Phase 3 BAŞLATILMAZ — Phase 2 systems polish mode.

## A. PRE-SCAN

1. Read PORTFOLYO_V4_EXECUTION_SYSTEM.md:
   - Bölüm 4.3 (Phase 3 architecture)
   - Bölüm 5.3 (Phase 3 sub-PR maps)
   - Bölüm 7 (Monetization Evolution — sıralama burada)
   - Bölüm 9 (Anti-patterns — "feature addiction" + "scope creep")

2. Read PORTFOLYO_V4_FUTURE_SYSTEMS.md:
   - §4 (Distribution Systems) — Discord + Newsletter detay
   - §5 (Monetization Systems) — pricing strategy

3. Phase 2 retro:
   - Hangi /lab experiment en popüler? → Phase 3 monetization sinyali
   - emredogan-cli adoption şekli nasıl?
   - lumina-chat npm DL'lar enterprise vs hobbyist mix?

4. Financial readiness:
   - Lemon Squeezy production-ready (V3'te sandbox)
   - Stripe Atlas opsiyonel (UK/EU customers için, defer)
   - Refund policy yazılmış, public (`/refund-policy`)
   - Terms of Service v1 yazılmış (`/terms`)
   - Privacy Policy v1 yazılmış (`/privacy`)

5. Environment vars yeni:
   - LEMON_SQUEEZY_PRODUCTION_KEY
   - LEMON_SQUEEZY_WEBHOOK_SECRET (production)
   - DISCORD_INVITE_LINK
   - RESEND_API_KEY (V3'te mevcut)
   - RESEND_AUDIENCE_ID (newsletter)

6. Bash: `git checkout main && git pull`
7. Bash: `git checkout -b feat/v4-phase3-monetization`

## B. IMPLEMENTATION ORDER

6 sub-PR. Monetization disiplini: highest-leverage önce, lowest-leverage geç.

### SUB-PR 3.1: lumina-chat Pro Managed Backend (14-21 gün)

**EN BÜYÜK SUB-PR.** Time budget: 14-21 gün. Aşamalı:

1. Architecture decision:
   - Option A: Same Vercel project, route group `app/(pro)/`
   - Option B: Separate Vercel project `lumina-pro.vercel.app`
   - **Karar: Option A** (paylaşılan KV + identity, ayrı subdomain Phase 4+'da)

2. Schema:
   - `pro:customer:<id>` — Lemon Squeezy customer record + API key
   - `pro:usage:<id>:<date>` — daily token consumption
   - `pro:billing:<id>` — subscription status
   - `pro:settings:<id>` — config (brand color, welcome msg)

3. Auth flow:
   - Lemon Squeezy webhook: subscription_created → generate API key
   - API key: HMAC-SHA256 with secret, stored hashed in KV
   - Customer dashboard requires Lemon Squeezy session cookie

4. Routes:
   - `app/(pro)/pro/dashboard/page.tsx` — usage, billing, settings
   - `app/(pro)/pro/login/page.tsx` — Lemon Squeezy SSO
   - `app/api/(pro)/chat/route.ts` — same as /api/chat but API-key auth + per-customer config
   - `app/api/pro/regenerate-key/route.ts` — key rotation

5. Customer-facing features:
   - Custom brand color (theme.brandColor passed to lumina-chat npm)
   - Custom welcome messages
   - Custom assistant name
   - Usage analytics dashboard
   - Daily/weekly cost projection

6. Telemetry:
   - `v4:monetization:lumina-chat-pro:mrr`
   - `v4:monetization:lumina-chat-pro:active_customers`
   - `v4:monetization:lumina-chat-pro:churn_rate_30d`

7. Pricing tiers:
   - Pro: $49/ay (100K tokens/ay, 1 brand)
   - Pro Plus: $99/ay (500K tokens/ay, 3 brands) — Phase 4+
   - Enterprise: custom — defer
   - 14-gün free trial, no credit card

Commit ladder:
- `phase4-v4: scaffold app/(pro) route group + Lemon Squeezy auth`
- `phase4-v4: implement Pro API key generation + KV schema`
- `phase4-v4: add Pro customer dashboard with usage analytics`
- `phase4-v4: implement /api/(pro)/chat with per-customer config`
- `phase4-v4: wire Lemon Squeezy webhook to Pro subscription lifecycle`
- `phase4-v4: launch lumina-chat Pro tier on Lemon Squeezy`

PR3.1 close: `phase4-v4: ship lumina-chat Pro managed backend (sub-pr 3.1)`

### SUB-PR 3.2: Premium Template cwh-saas-starter (7-10 gün)

1. Create `packages/templates/cwh-saas-starter/`:
   - Fork of own portfolio structure
   - Pre-wired: Lemon Squeezy, Vercel KV, Bedrock, Resend
   - README: 5-min quickstart
   - Pre-built: landing page + dashboard + billing + auth

2. Strip personal content (Emre's bio, projects), replace with placeholders

3. Lemon Squeezy product setup:
   - Product: "CWH SaaS Starter Template"
   - Price: $299 one-time
   - Delivery: encrypted GitHub repo invite via webhook

4. Webhook: `/api/lemon-webhook` extension
   - On template purchase: invite buyer to private GitHub repo
   - Email confirmation via Resend

5. Documentation:
   - `/templates/cwh-saas-starter` (marketing page)
   - "What you get" + screenshots
   - "Built for" — solo SaaS founders

6. Telemetry: `v4:monetization:templates:sales`

Commit ladder:
- `phase4-v4: scaffold packages/templates/cwh-saas-starter`
- `phase4-v4: add template marketing page at /templates/cwh-saas-starter`
- `phase4-v4: wire template purchase webhook with GitHub invite delivery`

PR3.2 close: `phase4-v4: ship first premium template cwh-saas-starter (sub-pr 3.2)`

### SUB-PR 3.3: Premium API /v1/lumina/chat (5-7 gün)

1. Architecture:
   - `app/api/v1/lumina/chat/route.ts` — public API
   - API key auth (Phase 3.1 generated keys reused)
   - Per-key rate limit (tier-based)
   - Per-key daily cost cap

2. OpenAPI spec:
   - `app/api/v1/openapi.json/route.ts` — auto-generated
   - `app/api/v1/docs/page.tsx` — Swagger UI render

3. Documentation:
   - Public docs at `/api/v1/docs`
   - Code examples (curl, JS, Python)

4. Rate limits:
   - Pro tier: 1000 req/ay, 50/dakika burst
   - Pro Plus tier: 5000 req/ay, 100/dakika burst

5. Telemetry:
   - `v4:monetization:api:requests_per_key`
   - `v4:cost:api:usd_daily`
   - Alert: per-key cost > $20/gün → auto-disable

Commit ladder:
- `phase4-v4: add /api/v1/lumina/chat public endpoint with API key auth`
- `phase4-v4: add per-key rate limit + cost cap`
- `phase4-v4: add OpenAPI spec + Swagger UI docs`

PR3.3 close: `phase4-v4: ship premium API surface v1 (sub-pr 3.3)`

### SUB-PR 3.4: Discord + Contributor Docs (2-3 gün)

1. Discord server external setup:
   - Channels: #welcome, #help, #contributors, #lumina-failures, #lumina-pro
   - Roles: contributor (auto-assigned if lumina-chat PR merged), pro-customer (auto via Lemon Squeezy)
   - Bot: Lumina-powered Discord bot (responds to !ask, sadece public channels)

2. Repo:
   - `CONTRIBUTING.md` (lumina-chat ve emredogan-cli için)
   - `.github/ISSUE_TEMPLATE/bug_report.yml`
   - `.github/ISSUE_TEMPLATE/feature_request.yml`
   - `.github/PULL_REQUEST_TEMPLATE.md`
   - `CODE_OF_CONDUCT.md`

3. Invite link:
   - In lumina-chat README
   - In `/community` page

Commit ladder:
- `phase4-v4: add CONTRIBUTING + issue templates + Code of Conduct`
- `phase4-v4: add /community page with Discord invite`
- `phase4-v4: add Discord bot for !ask command (separate repo, deploy)`

PR3.4 close: `phase4-v4: launch Discord + contributor infrastructure (sub-pr 3.4)`

### SUB-PR 3.5: Newsletter Weekly Digest (3-4 gün)

1. Resend audience setup
2. Signup form:
   - Footer'da subtle "Get Emre's weekly digest"
   - Double opt-in confirmation
3. Lib: `lib/newsletter.ts`
   - `subscribeEmail(email)` — adds to Resend audience
   - `sendDigest()` — drafts + sends weekly
4. Cron: `vercel.json` weekly Tuesday 09:00 GMT+3
5. Digest template:
   - Recent commits from `/changelog`
   - New notes from Notes 2.0
   - Lumina answer of the week
   - Project status update (CWH MRR, npm DL stats)
6. Unsubscribe handled by Resend

Commit ladder:
- `phase4-v4: add newsletter signup form to Footer`
- `phase4-v4: add /api/newsletter signup + Resend integration`
- `phase4-v4: add weekly digest cron with auto-generated content`

PR3.5 close: `phase4-v4: ship newsletter weekly digest (sub-pr 3.5)`

### SUB-PR 3.6: Clip Extraction Pipeline Semi-Auto (5-7 gün)

1. Lumina best-answer detection:
   - Signal: copy button pressed + follow-up positive sentiment
   - KV: `v4:clips:candidates:<week>` — list of candidate answer IDs

2. Video render pipeline:
   - `scripts/clip-extractor/render.ts`
   - Input: answer text + Lumina avatar PNG + cyan accent
   - Output: 30-second 1080p MP4 (ffmpeg)
   - Local-only execution (Emre's machine, weekly batch)

3. Admin approval UI:
   - `/admin/clips` page (auth: Lemon Squeezy admin role)
   - Preview MP4 + tweet draft
   - "Approve" → posts via existing Twitter media pipeline
   - "Reject" → deletes from KV

4. Auto-post (Phase 5 — Phase 3'te manuel approval)

Commit ladder:
- `phase4-v4: add Lumina best-answer detection heuristic + KV log`
- `phase4-v4: add ffmpeg-based clip render script (local-only)`
- `phase4-v4: add /admin/clips approval UI`
- `phase4-v4: wire admin approval to Twitter media post`

PR3.6 close: `phase4-v4: ship clip extraction pipeline semi-auto (sub-pr 3.6)`

## C. QUALITY CONTROL

(a) Build + type-check + Lighthouse (Phase 1-2 pattern)

(b) Pro backend security audit:
- API key hash storage verify
- Per-customer KV isolation verify
- Cost cap auto-disable test

(c) Template buyer flow test:
- Sandbox purchase → repo invite delivered < 60s
- Refund flow test (within 14 gün)

(d) API rate limit test:
- 51 req/dakika → 429 response
- Cost cap test: simulate $20+ → key auto-disable

(e) Discord moderation test:
- Bot doesn't spam
- !ask response < 3s
- Spam filter active

(f) Newsletter test:
- Signup → confirmation email < 30s
- Unsubscribe link works
- Weekly digest sends Tuesday 09:00 GMT+3

(g) Clip pipeline test:
- Generate 1 clip end-to-end
- ffmpeg render < 60s
- Twitter upload + post test

## D. GIT DİSCİPLİNE

Branch: `feat/v4-phase3-monetization`
6 sub-PR.
**Critical:** Per-PR observation 14 gün (monetization riski yüksek).

## E. FINAL VALIDATION

- [ ] lumina-chat Pro: 10+ paying customer
- [ ] Premium template: 5+ sales (cwh-saas-starter)
- [ ] Premium API: 5+ active key
- [ ] Discord: 50+ contributor member
- [ ] Newsletter: 200+ subscriber, >30% open rate
- [ ] Clip extraction: 1+ approved + posted
- [ ] MRR ≥ $1K (lumina Pro + API + CWH)
- [ ] /telemetry'de tüm Phase 3 sistemler tracked
- [ ] No Pro customer support ticket >24h unanswered
- [ ] Founder energy: 22 saat/hafta sürdürülebilir
- [ ] Cinematic identity korunmuş

Phase 3 closed. Phase 4'e 90-gün observation sonrası geçilir.

==============================================
PHASE 3 SON.
==============================================
```

---

### 6.4 PHASE 4 PROMPT — AI-Native Operating Layer

```
==============================================
PHASE 4 — AI-NATIVE OPERATING LAYER
Hedef Süre: 120-180 gün
Risk Seviyesi: YÜKSEK (kompleksite)
Leverage Skoru: 7/10
==============================================

ÖN KOŞUL: Phase 3 deployed, 90-gün observation:
- MRR ≥ $1K, growing 6 ay
- lumina-chat Pro 10+ customer churn <10%
- Discord 50+ member, organic activity
- Founder energy yeşil 90 gün
- Hiçbir Pro customer security incident
Aksi takdirde Phase 4 BAŞLATILMAZ.

## A. PRE-SCAN

1. Read PORTFOLYO_V4_EXECUTION_SYSTEM.md:
   - Bölüm 4.4 (Phase 4 architecture)
   - Bölüm 5.4 (Phase 4 sub-PR maps)
   - Bölüm 1.4 (Tier B/C — Phase 4 Tier B)
   - Bölüm 8.4 (Anti-pattern: WebGPU obsession too early)

2. Read PORTFOLYO_V4_FUTURE_SYSTEMS.md:
   - §3 (Lumina V4/V5) — Phase 4 V4 odaklı, V5 erken yapılmaz

3. Phase 3 retro:
   - Hangi Pro feature en çok request edildi?
   - Sub-agent için demand var mı (Discord/support tickets)?
   - Voice mode (mevcut chat içi) opt-in adoption %?

4. Architectural decisions:
   - Multi-agent infra: monorepo internal vs separate packages?
     **Karar:** monorepo internal (`lib/lumina/agents/`), publish Phase 5+'da
   - Cross-visit memory schema:
     **Karar:** fingerprint = anonymous device hash + opt-in cookie
   - Cloud Lab security:
     **Karar:** read-only STS only, external pentest mandatory before launch

5. Critical: scope cut budget
   - Phase 4 maintenance baseline = 38 saat/ay (Phase 3'ten)
   - Yeni Phase 4 work = 13 saat/hafta hedef (4 sub-PR'a göre)
   - Toplam: 60+ saat/hafta — **kabul edilemez**
   - Mecburi: Phase 4 boyunca **2 sub-PR'ı 1 sub-PR'a birleştir veya 1 sub-PR'ı sonraya at**
   - Karar (Phase 4 başında): hangisi?
     Önerilen: Sub-PR 4.4 (voice persistent) Phase 5'e ertelenir, başlangıçta chat-only voice korunur

6. Environment vars yeni:
   - AWS_ACCESS_KEY_ID / SECRET_ACCESS_KEY (STS için, ayrı IAM user)
   - LUMINA_FINGERPRINT_SECRET (HMAC için)
   - GITHUB_PAT_REPO_ACCESS (lib reading için, public-only)

7. Bash: `git checkout main && git pull`
8. Bash: `git checkout -b feat/v4-phase4-ai-native`

## B. IMPLEMENTATION ORDER

4 sub-PR (4.4 voice ertelendi, scope cut). Sırayla:

### SUB-PR 4.1: Lumina V4 Persistent Companion (10-14 gün)

1. Schema:
   - `v4:lumina:visitor:<fp>` — { topics: [], firstSeen, lastSeen, optIn }
   - `v4:lumina:visitor:<fp>:conversations:<sessionId>` — message threads

2. Fingerprint:
   - Anonymous device hash (browser fingerprint via @fingerprintjs/fingerprintjs-open)
   - HMAC with LUMINA_FINGERPRINT_SECRET (server-side, never exposed)
   - Stored in opt-in cookie (`lumina-fp`, 90-gün)

3. Hydration flow:
   - LuminaWindow mount → check cookie
   - If exists: GET `/api/lumina/visitor/<fp>` → topic graph
   - If new: prompt "Save context across visits?" (opt-in)

4. Topic extraction:
   - On conversation end: Claude eval extracts 1-3 topics from thread
   - Append to visitor's topic graph
   - Visitor returns → "Last time we discussed X" greeting

5. Privacy:
   - Prominent "Forget me" button in Lumina header
   - One-click → KV delete + cookie clear
   - Privacy policy update

Commit ladder:
- `phase4-v4: install @fingerprintjs/fingerprintjs-open`
- `phase4-v4: add HMAC-hashed visitor fingerprint cookie`
- `phase4-v4: add /api/lumina/visitor route with topic graph`
- `phase4-v4: add topic extraction post-conversation`
- `phase4-v4: add "Forget me" + opt-in UI`

PR4.1 close: `phase4-v4: ship Lumina V4 persistent companion (sub-pr 4.1)`

### SUB-PR 4.2: Lumina V4 Repo-Aware Tools (5-7 gün)

1. Octokit setup with GITHUB_PAT_REPO_ACCESS (public-only scope)

2. New tools in `lib/lumina/tools.ts`:
   - `readSourceFile({ path })` → reads file via Contents API, truncates to 200 lines max
   - `explainCommitRationale({ sha })` → fetches commit + body + linked PR
   - `diffArchitectures({ projectIdA, projectIdB })` → reads both projects' architecture pages, returns side-by-side

3. Tool eval pipeline:
   - `scripts/lumina-eval/repo-tools.ts`
   - Test 20 known queries, score accuracy
   - Target: >90% accuracy

4. Public exposure:
   - `app/lumina/brain/repo-tools/page.tsx` — public tool schemas

Commit ladder:
- `phase4-v4: add readSourceFile tool with Octokit`
- `phase4-v4: add explainCommitRationale tool`
- `phase4-v4: add diffArchitectures tool`
- `phase4-v4: add repo-tools eval pipeline`
- `phase4-v4: publish Lumina brain at /lumina/brain/repo-tools`

PR4.2 close: `phase4-v4: ship Lumina V4 repo-aware tools (sub-pr 4.2)`

### SUB-PR 4.3: Lumina V4.5 Multi-Agent Infrastructure + Sub-Agent 1 (14-21 gün)

**KRITIK:** Bu Phase 4'ün en büyük sub-PR'ı. Multi-agent debug zor.

1. Architecture:
   - `lib/lumina/agents/` — directory
   - `lib/lumina/agents/architecture-critic.ts` — first agent
   - `lib/lumina/router.ts` — dispatches based on intent
   - Default: single Lumina (V4 persistent companion)
   - Triggered by: "Review my architecture", "Critique this design"

2. architecture-critic system prompt:
   - Public at `/lumina/brain/architecture-critic`
   - Tone: technical, direct, evidence-based
   - Tools subset: getProjectDetails, diffArchitectures (no auto-action)

3. Router logic:
   - Intent detection: lightweight Claude Haiku call (regex first, LLM second)
   - Handoff: orchestrator → sub-agent with conversation context
   - Sub-agent response → orchestrator → user

4. Eval pipeline per agent:
   - Weekly: 50 sampled conversations
   - Accuracy, helpfulness, tone consistency scored

5. Failure log:
   - `/lumina/failures/architecture-critic` page
   - Weekly retrospective post

6. Telemetry:
   - `v4:adoption:sub-agent:architecture-critic:invocations`
   - `v4:eval:architecture-critic:accuracy_weekly`

Commit ladder:
- `phase4-v4: scaffold lib/lumina/agents/ + router`
- `phase4-v4: add architecture-critic sub-agent system prompt + tools`
- `phase4-v4: implement intent detection + handoff logic`
- `phase4-v4: add per-agent eval pipeline`
- `phase4-v4: publish architecture-critic brain at /lumina/brain/...`
- `phase4-v4: add /lumina/failures/architecture-critic public log`

PR4.3 close: `phase4-v4: ship Lumina V4.5 multi-agent infrastructure (sub-pr 4.3)`

### SUB-PR 4.4: Cloud Lab MVP (Visitor STS Connect + Read-Only Scan) (10-14 gün)

**ÇOK YÜKSEK SECURITY RİSKİ.** External pentest mandatory.

1. CloudFormation template generator:
   - `app/lab/cloud-scan/page.tsx`
   - Visitor inputs: AWS region(s)
   - Generates downloadable CloudFormation template
   - Template creates: read-only IAM role + ExternalId + trust policy

2. Visitor flow:
   - Step 1: Deploy CloudFormation in their AWS account
   - Step 2: Paste resulting Role ARN
   - Step 3: STS AssumeRole → temporary credentials (1-hour max)
   - Step 4: CWH scan runs against their account
   - Step 5: Results stream via Lumina chat

3. Scanner:
   - Reuse CWH backend (Python Lambda) OR port to Vercel edge functions
   - Read-only API calls only: ec2:Describe*, rds:Describe*, iam:List*, etc.
   - No writes, no deletes, no remediation

4. Security:
   - Temporary credentials wiped after scan
   - Comprehensive audit log: who, when, what scanned, results size
   - 60-dakika hard timeout
   - External ID rotation per session
   - **External pentest before launch (mandatory)**

5. Cost cap:
   - Per-visitor cap: $5 (Bedrock for remediation suggestions)
   - Daily total cap: $50

6. Telemetry:
   - `v4:adoption:cloud-lab:scans_completed_daily`
   - `v4:security:cloud-lab:audit_log_entries`
   - `v4:cost:cloud-lab:usd_daily`

Commit ladder:
- `phase4-v4: scaffold /lab/cloud-scan UI`
- `phase4-v4: add CloudFormation template generator`
- `phase4-v4: add /api/cloud-scan/assume-role endpoint`
- `phase4-v4: integrate CWH scanner with temporary credentials`
- `phase4-v4: add comprehensive security audit log`
- `phase4-v4: external pentest review + hardening`
- `phase4-v4: launch Cloud Lab MVP`

PR4.4 close: `phase4-v4: ship Cloud Lab MVP visitor STS scan (sub-pr 4.4)`

## C. QUALITY CONTROL

(a) Build + Lighthouse pattern

(b) Lumina V4 eval:
- 30 test conversations cross-session continuity
- Topic graph accuracy >85%

(c) Multi-agent debugging:
- 100 sampled conversations
- Sub-agent routing correctness >90%
- Latency p95 < 3s

(d) Cloud Lab security verify:
- External pentest report obtained
- All findings remediated
- Audit log working
- Temporary credentials wipe verified (no leak)

(e) Cost monitoring:
- Phase 4 total monthly cost <$300
- Per-visitor cap enforced

(f) Feature flag verify:
- Lumina V4 features behind `v4:flag:<feature>` KV keys
- Rollback test: flag off → V2 fallback works

## D. GIT DİSCİPLİNE

Branch: `feat/v4-phase4-ai-native`
4 sub-PR (voice persistent ertelendi).
Per-PR observation 14-21 gün (kompleksite + risk).
**Mandatory:** Phase ortasında 14-gün off (burnout prevention).

## E. FINAL VALIDATION

- [ ] Lumina V4 persistent: 7-gün önceki konuşma referans (test edildi)
- [ ] Repo-aware tools: 3 tool çalışıyor, eval >90%
- [ ] Multi-agent: architecture-critic production-ready
- [ ] Cloud Lab MVP: pentest tamamlandı, 100+ visitor scan
- [ ] /lumina/brain + /lumina/failures public
- [ ] MRR ≥ $5K (Phase 3 + Phase 4 cross-sell)
- [ ] Founder energy yeşil (Phase 4 ortası 14-gün off alındı)
- [ ] Cinematic identity korunmuş
- [ ] Cost monthly < $300

Phase 4 closed. Phase 5'e geçilir **sadece** Bölüm 4.5 koşulları tutarsa. Aksi takdirde V4 burada **stabil mode**'a girer.

==============================================
PHASE 4 SON.
==============================================
```

---

### 6.5 PHASE 5 PROMPT — Experimental Expansion (Conditional)

```
==============================================
PHASE 5 — EXPERIMENTAL EXPANSION (CONDITIONAL)
Hedef Süre: 180+ gün
Risk Seviyesi: ÇOK YÜKSEK
Leverage Skoru: 4-6/10 (volatile)
==============================================

⚠️ Phase 5 sadece şu koşullarda BAŞLATILIR:

- Phase 4 MRR ≥ $5K, 6 ay devamlı
- lumina-chat npm 1K+ haftalık DL, 6 ay devamlı
- /lab 5K+ unique visit/ay, 3 ay devamlı
- Conference talk en az 1 accept
- Founder energy yeşil 60 gün
- Part-time contractor en az 1 (önceden işe alınmış)

Bu 6 koşulun tamamı tutmuyorsa Phase 5 BAŞLATILMAZ. V4 burada
"stabil mode"'a girer; mevcut sistemler scale + polish edilir.

## A. PRE-SCAN

Tüm V4 dokümanları + Phase 1-4 post-mortems oku.

Her sub-PR için kendi pre-scan yazılır (Phase 5 başladığında V4
EXECUTION SYSTEM v2.0 yayınlanır).

## B. SUB-PR LİSTESİ (önerilen sıra)

1. Architecture Playground (react-flow drag-drop)
2. WebGPU 3D cloud topology
3. lumina-chat Local Mode (WebLLM)
4. Multimodal Lumina (Claude Vision)
5. Sub-agent 2-3 (code-reviewer, opportunity-scout)
6. 2. Cohort iteration

Her sub-PR Phase 4 prompts ile aynı pattern (pre-scan, implementation
order, QC, git discipline, final validation).

## C. CRITICAL CAVEAT

Phase 5 sub-PR'ları **paralel execute edilmez**. Her biri 4-8 hafta.
Toplam Phase 5 süresi: 6 sub-PR × 6 hafta avg = 9 ay minimum.

## D. EXIT CRITERIA

Phase 5 herhangi bir noktada **abort** edilebilir:
- 30-gün maintenance burden > 50 saat/ay sustained
- 2 ardışık sub-PR < 50 unique users
- Founder energy kırmızı 2 ardışık ay
- Contractor ayrılırsa + replacement yoksa

Abort sonrası: built sistemler maintain, yeni sub-PR durur.

==============================================
PHASE 5 SON.
==============================================
```

---

## 📡 7. DISTRIBUTION ENGINE ROADMAP

> Compounding kanalları, founder-energy bütçesi içinde sequenced.

### 7.1 Sequencing Strategy

| Kanal | Phase | Aktivasyon Maliyeti | Compounding Speed |
|-------|-------|----------------------|--------------------|
| Auto-tweet (mevcut V3) | Carry-over | 0 saat (cron) | Slow burn |
| Auto-tweet 2.0 multi-format | Phase 1 | 5 saat setup | Medium |
| /telemetry public | Phase 1 | 5 saat setup | Slow (compound trust) |
| /changelog | Phase 1 | 5 saat setup | Slow (compound authority) |
| YouTube Monk Mode | Phase 1 | 4-5 saat/video | Slow but durable |
| /lab experiments | Phase 2 | 5-10 saat/experiment | Fast (viral candidate) |
| emredogan-cli | Phase 2 | 10-15 saat | Slow (developer touch) |
| Notes 2.0 multi-format | Phase 2 | 4 saat/note | Slow (SEO compound) |
| Reverse engagement | Phase 2 | 30dk/gün ongoing | Fast (relationship) |
| YouTube Architecture-from-Scratch | Phase 2 | 6 saat/video | Slow |
| Discord | Phase 3 | 4 saat/hafta moderation | Medium (community) |
| Newsletter | Phase 3 | 2 saat/hafta | Medium |
| Clip extraction | Phase 3 | 2 saat/clip | Fast (viral) |
| YouTube Reverse Engineering | Phase 4 (defer if scope cut) | 8 saat/video | Slow |
| Conference talks | Phase 4 | 20 saat/talk prep | Burst (high impact) |
| Live build streams | Phase 4+ (conditional) | 8 saat/stream | Medium |
| Cohort program | Phase 4 (conditional) | 30 saat/cohort | Burst |

### 7.2 Automation Opportunities

| Aktivite | Manuel | Automated | Phase |
|----------|--------|------------|-------|
| Daily tweet | Eski: 15 dk/gün | Auto-tweet (V3) | Done |
| Weekly tweet thread | Manuel | Auto-tweet 2.0 weekly | Phase 1 |
| Incident post | Manuel | Sentry → auto-draft | Phase 1 |
| Notes audio | Manuel | TTS pipeline cron | Phase 2 |
| Changelog | Manuel | GitHub API + cache | Phase 1 |
| Newsletter digest | Manuel | Cron + content aggregation | Phase 3 |
| Lumina clip | Manuel | Best-answer detection + ffmpeg | Phase 3 (semi-auto) |
| Twitter reverse reply | Manuel | Lumina-drafted, Emre approves | Phase 2 |
| Conference draft | Manuel | Manuel (high-touch) | Phase 4 |

**Compounding Effect Analysis:**
- Automated kanallar zaman üzerinde scale eder (içerik sürekli akıyor)
- Manuel kanallar burst değer üretir (conference, cohort) ama compounding'i yavaş
- Hibrit (auto-draft + manuel approve) en sürdürülebilir solo-founder pattern

### 7.3 Maintenance Overhead Bütçesi

| Phase | Distribution Maintenance (saat/ay) |
|-------|---------------------------------------|
| 1 | 6 saat (cron izleme + 4-5 YouTube video) |
| 2 | 12 saat (içerik + reverse engagement + 2 YouTube series) |
| 3 | 20 saat (3 + 2 + newsletter + Discord + clip approval) |
| 4 | 28 saat (above + conference prep + 3. YouTube series) |
| 5 | 35+ saat — **gerektiriyor:** contractor desteği |

**Sustainability gate:** Maintenance > 30 saat/ay → yeni kanal **eklenmez**, mevcut sunset değerlendirilir.

### 7.4 Channel Termination Rules

Her kanal için minimum hedef:

| Kanal | 90-gün hedef | Sunset criteria |
|-------|---------------|-----------------|
| YouTube Monk Mode | 100 sub | < 50 sub 6 ay → pause |
| YouTube Architecture | 200 sub | < 100 sub 6 ay → pause |
| YouTube Reverse Engineering | 100 sub | < 50 sub 6 ay → drop |
| Newsletter | 200 subscriber | < 100 sub 6 ay → pause |
| Discord | 50 member | < 30 active 6 ay → pause invitations |
| Cohort | 20+ alumni (1st cohort) | < 15 → 2nd cohort cancel |
| Clip extraction | 1 viral candidate/ay | 0/ay 3 ay → pipeline pause |

---

## 💸 8. MONETIZATION EVOLUTION PLAN

> Realistic sıra. Yüksek leverage önce, düşük leverage geç.

### 8.1 Activation Sequence

| # | Ürün | Phase | Aktivasyon Zaman | Beklenen 90-gün MRR |
|---|------|-------|--------------------|------------------------|
| 1 | CWH Pro (already live) | Carry-over | 0 | $0 → $500 (growth) |
| 2 | lumina-chat Pro | Phase 3 | 14-21 gün | $490 (10 customer) |
| 3 | Premium template #1 | Phase 3 | 7-10 gün | $1495 one-time + $0 MRR |
| 4 | Premium API v1 | Phase 3 | 5-7 gün | $495 (5 customer) |
| 5 | Premium template #2 (Phase 4) | Phase 4 | 5-7 gün | $1495 |
| 6 | lumina-chat Pro Plus | Phase 4 | 5 gün | $1485 (15 customer) |
| 7 | Architecture Consulting | Phase 4 (organic demand only) | 0 setup | $1200 (4 calls × $297) |
| 8 | Cohort 1 (conditional) | Phase 4 sonu | 30 gün setup | $9940 (20 × $497) one-time |
| 9 | Enterprise CWH (conditional) | Phase 5 | 60 gün setup | $999/customer |
| 10 | Sponsored Lumina answers | Phase 5 | 30 gün | Variable |
| 11 | Recorded courses | Phase 5+ | 60+ gün/course | $14,850 (50 × $297) |

### 8.2 Leverage Ranking

**Tier A — Yap (Phase 3-4):**
- lumina-chat Pro (recurring + low ops)
- Premium templates (zero ops after sale)
- Premium API (recurring + automated)

**Tier B — Yap (Phase 4+, organic demand):**
- Architecture consulting (organic)
- Cohort 1 (high cash burst, ama time-intensive)

**Tier C — Yapma (Phase 5+ koşullu):**
- Enterprise tiers (inbound only)
- Sponsored answers (10K+ Lumina conversation gerekir)
- Recorded courses (60+ saat üretim, defer)

**Tier D — Asla:**
- Multi-language i18n
- Mobile app
- White-label
- Reseller programs

### 8.3 Customer Support Strategy

Her ürün için support tier:

| Ürün | Support Tier | Time per Ticket |
|------|--------------|------------------|
| lumina-chat Pro | Tier 1 (email, 48h SLA) | 15 dk |
| Premium template | Tier 2 (Discord + email, 7-gün SLA) | 20 dk |
| Premium API | Tier 1 (email, 48h SLA) | 10 dk |
| Cohort | Tier 0 (live + Discord, immediate) | 30 dk |
| CWH Pro | Tier 1 (email, 48h SLA) | 25 dk |

**Sustainability:** Toplam support time aylık < 20 saat. Üstü → otomatik FAQ + Lumina-powered support bot.

### 8.4 Revenue Targets per Phase

| Phase | Sonu MRR Hedef | Sonu Cumulative Cash |
|-------|------------------|------------------------|
| 1 | $0 (foundation) | ~$0 |
| 2 | $0 (lab adoption) | ~$0 |
| 3 | $1K | ~$5K (templates + API) |
| 4 | $5K | ~$30K (cohort + scale) |
| 5 (if executed) | $20K | ~$120K |

**Solo-founder yaşam hedefi:** Phase 4 sonu MRR Emre'yi tam zamanlı destekler (Turkey COL — ~$3K/ay bare minimum, $5K comfortable).

### 8.5 Pricing Discipline

- Pricing **public**. Quote-on-request yok.
- Annual discount: -20% (yearly billing)
- 14-gün free trial, no credit card
- Refund: 30-gün money-back (kullanıcı hızlı support için churn risk düşük)
- Sürpriz fee yok (cost cap clear, overage = email warning + auto-pause)

---

## 🚫 9. ANTI-PATTERN SYSTEM

V3'ün anti-patterns'i V4 boyunca **aynen** geçerli kalır. V4'e özgü ek anti-patterns:

### 9.1 V4 Engineering Anti-Patterns

- ❌ **WebGPU early adoption** — Phase 5'ten önce ASLA. Browser fragmentation + bundle ağır
- ❌ **Local-first LLM (WebLLM) Phase 5'ten önce** — distilled UX zayıf
- ❌ **Multi-agent before single-agent hardened** — debugging cehennemi
- ❌ **Subdomain federation Phase 4'ten önce** — infra overhead, ROI marjinal
- ❌ **Voice ambient (wake-word) early** — permission UX, privacy concern
- ❌ **Multimodal screen share early** — WebRTC infra ağır, privacy belirsiz
- ❌ **Distributed agent message bus** — single Lumina hardening daha yüksek leverage
- ❌ **Autonomous remediation auto-merge** — bir hata SaaS itibarını bitirir
- ❌ **5+ npm package aynı anda maintain** — security update fatigue
- ❌ **3+ YouTube series aynı anda** — content burnout
- ❌ **Yeni dep > 30 KB gz justification yok** — bundle bloat

### 9.2 Feature Addiction Anti-Patterns

- ❌ **"Bu trend, biz de yapalım"** — 7-gün bekle, hala önemliyse değerlendir
- ❌ **"Bu cool gibi"** — Cool Demo Syndrome filter (Bölüm 1.6) uygulanır
- ❌ **"Bir kullanıcı istedi"** — N=1 demand feature değil, signal değildir
- ❌ **"X şirketinde var, bize de lazım"** — copy karar değildir
- ❌ **"Twitter'da trending"** — trend = noise, signal değil
- ❌ **"Conference'ta gördüm"** — observation karar değil

### 9.3 Solo-Founder Anti-Patterns

- ❌ **Infinite roadmap** — V4 sonra V5 yazılmaz; Phase 4 sonu V4 done
- ❌ **Reactive trend chasing** — yeni AI model çıktı diye refactor yapılmaz
- ❌ **Architecture perfectionism** — "ideal" abstraction aramak; 3-yer rule kırılır
- ❌ **"Cool demo syndrome"** — viral aspirasyonu olmayan demo yapılmaz
- ❌ **Vanity engineering** — kimse görmeyecek code yazılmaz
- ❌ **Unfinished experimental loops** — Phase'i bırakıp Phase 5'e koşmak
- ❌ **Sürekli rewrite** — V3'ten V4'e büyük rewrite yok; surgical extension

### 9.4 Brand Anti-Patterns

- ❌ **Generic SaaS positioning** — Lumina'yı "AI assistant" olarak satma; "Emre's personality" olarak
- ❌ **Enterprise abstraction** — Pro tier branding "Pro", "Plus" sade; "Enterprise" defer
- ❌ **Identity fragmentation** — subdomain'ler farklı brand kullanamaz
- ❌ **Artificial hype** — "Revolutionary AI" gibi cliché yasak
- ❌ **Trend-chasing copy** — copy 2026'da yazıldı, 2027'de hala geçerli olsun

### 9.5 Sürekli Tetikte Kalınacak 10 Tehlike

1. **Hafta 6 burnout** — Phase başında enerji yüksek, hafta 6'da düşüş
2. **Pro customer 1. ay churn** — onboarding kötüyse hızlı kaybedilir
3. **AWS bill sürprizi** — Bedrock cost günlük izlenmez ise spike
4. **Discord time sink** — 30dk → 2 saat farkına varmadan
5. **YouTube video kalitesi düşüş** — perfectionism kaybedilir, ship etme zorlaşır
6. **Multi-agent debug rabbit hole** — 1 sub-agent çalışmazsa 1 hafta kaybolur
7. **STS Cloud Lab security incident** — bir leak SaaS bitirir
8. **GitHub Sponsors hayal kırıklığı** — 0 sponsor 6 ay → moral
9. **Twitter API change** — sürekli izlenmesi gereken external risk
10. **Lumina-chat npm 0 download** — Phase 1 sonu sıfırsa Phase 3 monetization risky

---

## ⏹️ 10. SYSTEM TERMINATION RULES

Her ship edilmiş sistem için terminate koşulu **şart**.

### 10.1 Termination Framework

| Sistem | Adoption Threshold (90-gün) | Maintenance Ceiling | Sunset Conditions |
|--------|---------------------------------|---------------------|-------------------|
| `@emredogan/lumina-chat` | 100+ haftalık DL | 4 saat/ay | < 50 DL 6 ay + 2nd npm package launched |
| `@emredogan/cli` | 50+ haftalık DL | 3 saat/ay | < 20 DL 6 ay → deprecate |
| `/telemetry` | N/A (internal use too) | 1 saat/ay | Never sunset (kendi kullanım) |
| `/changelog` | 100+ visits/ay | 1 saat/ay | < 50 visits 6 ay → reduce update frequency |
| `/lab/<experiment>` | 500+ visits/ay her experiment | 1 saat/ay each | < 200 visits 6 ay → archive |
| Auto-tweet 2.0 (each format) | 30-gün < 5 failure | 1 saat/ay | Twitter API change > 7 gün down → format sunset |
| YouTube series | 100 subscriber/series 6 ay | 16 saat/ay/series | < 50 sub 6 ay → pause series |
| Newsletter | 200+ subscribers, 30%+ open | 4 saat/ay | < 100 sub 6 ay → pause |
| Discord | 50+ active members | 4 saat/hafta | < 30 active 6 ay → pause invitations |
| lumina-chat Pro | 10+ customer 6 ay | 4 saat/hafta | < 5 customer 6 ay → sunset tier (refund) |
| Premium template | 5+ sales/template 90-gün | 2 saat/template/ay | < 2 sales 90-gün → unlist |
| Premium API | 5+ key 90-gün | 2 saat/ay | < 3 key 90-gün → unlist tier |
| Cohort program | 20+ student per cohort | 30 saat/cohort | < 15 student → 2. cohort cancel |
| Architecture Consulting | Organic only | 4 saat/call | < 1 call/ay 6 ay → pause |
| Sub-agent | 100+ invocations/ay | 4 saat/ay | < 50/ay 6 ay → sunset agent |
| Cloud Lab | 50+ scan/ay | 4 saat/ay | < 20 scan/ay 6 ay → archive |

### 10.2 Sunset Process

1. **Warning state (`v4:lifecycle:<system>:status` = `sunset_warning`)**:
   - Visible banner on system page: "This system is under review for sunset"
   - Public blog post explaining
   - Active users notified via email (newsletter, Discord)

2. **30-gün observation:**
   - Adoption signal son şans
   - Eğer pickup varsa → status = `active` reverted
   - Yoksa → next step

3. **Archive state (`status = archived`):**
   - Page kalır ama "archived" badge
   - New signups disabled (Pro, API key)
   - Existing customers grandfathered (60-gün notice)
   - Refunds processed
   - Repo/package: `npm deprecate` veya repo archive

4. **Hard delete (1 yıl sonra):**
   - Repo silinmez (archive kalır)
   - Page silinir veya 301 redirect

### 10.3 Termination Ödüller (Psychological)

Sunset = başarısızlık değil. Sunset = **doğru karar**. Doğru karar verme ödüllendirilir:

- Sunset sonrası blog post: "Why I sunset X" — community öğrenir
- Twitter thread: "5 things I sunset and 3 I'd build again"
- Discord retrospective: contributor'lara karar paylaşılır

Sunset disiplini olmadan platform **junkyard'a dönüşür**. V4'ün en önemli kuralı.

---

## 📅 11. OPERATIONAL CADENCE SYSTEM

Founder enerjisi disipliniyle sürdürülebilir cadence.

### 11.1 Daily Rhythm (Hafta İçi)

```
01:30 - 06:00  Bakery shift (work, dış kazanç)
06:00 - 08:00  Sleep + breakfast
08:00 - 14:00  School (lise + sınav hazırlık)
14:00 - 15:00  Lunch + decompression
15:00 - 18:00  Build window (focused coding, 3 saat)
18:00 - 19:00  Discord/Twitter/email batch (1 saat hard cap)
19:00 - 20:30  Dinner + family
20:30 - 22:00  Content (YouTube edit, blog draft, vb.)
22:00 - 01:00  Sleep
```

**Toplam günlük build:** 3 saat dev + 1.5 saat content = 4.5 saat (haftada 5 gün = 22.5 saat)
**Hafta sonu:** Cumartesi 4 saat (tek build session), Pazar OFF (mandatory)

### 11.2 Weekly Shipping Rhythm

| Gün | Aktivite |
|------|----------|
| Pazartesi | Phase sub-PR planning + start |
| Salı | Sub-PR implementation (deep work) |
| Çarşamba | Sub-PR implementation + test |
| Perşembe | Polish + commit + push |
| Cuma | PR + deploy + observation start |
| Cumartesi | Content creation (YouTube + blog) |
| Pazar | OFF (mandatory) |

**Cadence ceiling:** Maks 1 sub-PR/hafta. Üstü → maintenance debt birikir.

### 11.3 Weekly Review (Cuma)

Her Cuma akşamı 30 dakika:

- [ ] Bu hafta ne ship edildi?
- [ ] /telemetry ne diyor (delta vs geçen hafta)?
- [ ] Founder energy hangi seviyede (1-5)?
- [ ] Sentry son 7 günde N error
- [ ] Next hafta priority

Review notes: `weekly-review-YYYY-MM-DD.md` (private, gitignored)

### 11.4 Monthly Cleanup (Ayın 1. Pazartesi)

- [ ] `npm audit` — security update
- [ ] `npm outdated` — dep review (otomatik update yok; manual confirm)
- [ ] Dead code scan: `grep -r "TODO\|FIXME" app components lib` → baseline kıyas
- [ ] /telemetry monthly snapshot save
- [ ] AWS Bedrock cost review
- [ ] Sentry quota check
- [ ] KV usage check (free tier limit)
- [ ] Lighthouse Mobile audit her route

### 11.5 Quarterly Reviews

#### Q1 (Phase 1 sonu)
- Architectural review: Phase 2'ye geçmeden V3 + V4 Phase 1 ile çelişki var mı?
- Ecosystem review: hangi distribution kanalı en güçlü compounded?
- Burnout review: 3 ay enerji metriği

#### Q2 (Phase 2 sonu)
- /lab adoption sinyal kalitesi
- emredogan-cli developer feedback
- Monetization readiness (Phase 3 öncesi)

#### Q3 (Phase 3 sonu)
- Monetization metrics: MRR, churn, customer satisfaction
- Sustainability: founder hala yeşilse Phase 4'e
- Pro customer NPS

#### Q4 (Phase 4 sonu)
- Lumina V4 eval scores
- Cloud Lab security incidents (umarım 0)
- Phase 5 koşulları kontrol → start vs stable mode kararı

### 11.6 Burnout Prevention Checkpoints

Üç-katmanlı circuit breaker:

**Layer 1 — Weekly Soft:**
- Cuma review'da founder energy 1-5 self-rate
- 2 ardışık hafta ≤ 2 → yellow flag
- 3 ardışık hafta ≤ 2 → mecburi 7-gün off

**Layer 2 — Monthly Hard:**
- Ay sonu: planned ship vs actual ship
- 2 ardışık ay < 50% → mecburi 14-gün off + scope cut

**Layer 3 — Quarterly Strategic:**
- Çeyrek sonu: physical health (sleep, exercise) self-audit
- 2 ardışık çeyrek red → mecburi 30-gün off + Phase delay

### 11.7 Annual Strategic Review

Her yıl başında (Ocak):

- V4 doc'un kendisi revize edilir mi? (revisions PR'ı)
- V5 vision yazma zamanı geldi mi? (V4 Phase 4 stable + Phase 5 başarılıysa)
- Cohort/Discord adoption velocity sürdürülebilir mi?
- Conference talk pipeline aktif mi?
- Personal life major changes (üniversite, askerlik) → roadmap update

---

## 📊 12. V4 SUCCESS METRICS

Her phase için **ölçülebilir, public**.

### 12.1 Phase 1 Metrics (Ay 3 hedef)

| Metric | Target | Stretch |
|--------|--------|---------|
| `@emredogan/lumina-chat` weekly DL | 100 | 300 |
| `/telemetry` daily visits | 50 | 200 |
| Auto-tweet 2.0 success rate | 99% | 100% |
| `/changelog` daily visits | 30 | 100 |
| YouTube Monk Mode subscriber | 100 | 500 |
| Github Sponsors count | 1 | 10 |
| Twitter follower growth | +500 | +2000 |

### 12.2 Phase 2 Metrics (Ay 6 hedef)

| Metric | Target | Stretch |
|--------|--------|---------|
| /lab total unique visits/ay | 1000 | 5000 |
| /lab experiment completions/ay | 200 | 1000 |
| `@emredogan/cli` weekly DL | 50 | 200 |
| `@emredogan/lumina-chat` weekly DL | 300 | 800 |
| Notes 2.0 audio plays | 100 | 500 |
| YouTube total subscribers | 500 | 2000 |
| Twitter reverse engagement replies | 20/ay | 100/ay |
| Conference CFP draft completed | 1 | 3 |

### 12.3 Phase 3 Metrics (Ay 9 hedef)

| Metric | Target | Stretch |
|--------|--------|---------|
| lumina-chat Pro paying customers | 10 | 30 |
| Premium template sales | 5 | 20 |
| Premium API active keys | 5 | 25 |
| Discord active members | 50 | 200 |
| Newsletter subscribers | 200 | 1000 |
| Newsletter open rate | 30% | 45% |
| MRR (total all streams) | $1K | $3K |
| Clip extraction approved + posted | 4 | 20 |
| Conference acceptance | 0-1 | 2 |

### 12.4 Phase 4 Metrics (Ay 15 hedef)

| Metric | Target | Stretch |
|--------|--------|---------|
| Lumina V4 persistent visitor return rate | 25% | 50% |
| Repo-aware tool eval accuracy | 90% | 95% |
| Sub-agent invocations/ay | 500 | 2000 |
| Cloud Lab scans completed | 100 | 500 |
| MRR | $5K | $15K |
| lumina-chat npm weekly DL | 1000 | 5000 |
| GitHub Sponsors count | 10 | 50 |
| Conference talk delivered | 1 | 2 |
| Public Lumina brain page visits/ay | 1000 | 5000 |

### 12.5 Phase 5 Metrics (Ay 24+, conditional)

Phase 5'e girilirse:

| Metric | Target |
|--------|--------|
| Architecture Playground use sessions/ay | 1000 |
| WebGPU 3D topology unique visits/ay | 2000 |
| Local-first WebLLM downloads | 500 |
| 2. Cohort enrollments | 30 |
| MRR | $20K |
| Recorded course sales | 30/ay |

### 12.6 Cross-Phase Vital Signs

**Founder Energy** (haftalık 1-5):
- Yeşil: ≥ 4
- Sarı: 3
- Kırmızı: ≤ 2

**Financial Sustainability** (aylık):
- Yeşil: MRR > monthly costs × 2
- Sarı: MRR > monthly costs × 1.2
- Kırmızı: MRR < monthly costs

**Deployment Reliability** (aylık):
- Yeşil: < 1 incident
- Sarı: 1-3 incident
- Kırmızı: > 3 incident

**OSS Adoption** (aylık trend):
- Yeşil: lumina-chat DL büyüyor
- Sarı: flat
- Kırmızı: düşüyor

3+ kırmızı vital sign → derhal Phase pause + retrospective.

---

## ⚖️ 13. FINAL STRATEGIC VERDICT

> Brutally honest. Diplomatik dil yok.

### 13.1 Tek En Yüksek Leverage Path

> **lumina-chat npm publish → adoption funnel → lumina-chat Pro managed backend.**

Tek-cümle stratejisi: OSS'i ship et → developer'lar install etsin → bir kısmı Pro'ya convert olsun → recurring revenue.

Bu path:
- Phase 1'de başlar (npm publish)
- Phase 3'te monetize edilir (Pro launch)
- Phase 4'te genişler (Pro Plus, multi-agent, Repo-aware)
- Tek bir cron'a, tek bir Vercel deploy'a, tek bir founder'a sığar

Diğer her şey bunu **besler** veya **dağıtır**.

### 13.2 Tehlikeli Dikkat Dağıtıcılar

Aşağıdakiler V4 vizyonunda yer alır ama V4 boyunca **muhtemelen ASLA build edilmemeli**:

| Idea | Neden Tehlikeli |
|------|-----------------|
| WebGPU 3D cloud topology | Cool demo syndrome; ROI sıfır eğer 3+ AWS account aktif değilse |
| Local-first WebLLM | UX zayıf, distilled model marka itibarını düşürür |
| Multimodal screen share | WebRTC infra debt; privacy concern; ROI marjinal |
| Distributed agent message bus | Single Lumina hardening daha önemli; anarchy risk |
| Autonomous CWH remediation Phase B-D | Bir auto-merge hatası şirketi bitirir |
| `monk.emredogan.com` forum | Cohort alumni yokken boş forum |
| 5-tier OSS package ladder aynı anda | Security update fatigue; quality düşer |
| 4 YouTube series aynı anda | Content creation burnout |
| Voice ambient (wake-word) | Permission UX, opt-in voice yeterli kalır |
| Sponsored Lumina answers | 10K+ conversation gerekir, Phase 4'ta hala yok |

V4 boyunca bunları **build etmemek**, V4'ün en başarılı taktiği olabilir.

### 13.3 Endüstri-Tanınırlık Adayları

Aşağıdakiler **gerçekten** internet-famous olabilir (hepsi olmaz ama 2-3'ü olur):

1. **`@emredogan/lumina-chat`** — eğer 10K+ haftalık DL'ya ulaşırsa, "Lumina pattern" referans olur
2. **AGENTS.md / CLAUDE.md template** — agent-ready codebase standardı olabilir
3. **Public engineering laboratory pattern** — "I run a lab" diğer kişisel siteler kopyalar
4. **/telemetry public dashboard** — "show your work" kültürünün öncüsü
5. **Auto-tweet 2.0 multi-format engine** — solo-founder content automation referansı
6. **Lumina tool-use rendering** — chat UI'ları için pattern adoption
7. **Cinematic identity protection disiplini** — AGENTS.md style guides için adoption

### 13.4 Asla Yapılmamalı V4 Sistemleri

V4 vizyon listelendi ama gerçekçi olarak **ROI negatif veya risk-asimetrik**:

| Sistem | Neden Asla |
|--------|-------------|
| Voice ambient mode (wake-word listening) | Privacy debt > UX kazanım |
| Multimodal screen share Lumina | WebRTC infra solo-founder için sürdürülemez |
| Autonomous CWH auto-merge | Bir kullanıcı production'ı çökerse SaaS biter |
| Sponsored Lumina answers | Brand integrity için risk yüksek |
| Enterprise tier early build | Inbound demand yok; build = waste |
| Multi-language i18n (TR/EN dışı) | Translation maintenance solo-founder için ölümcül |
| Mobile native app | Web app PWA mevcut, ROI sıfır |
| White-label lumina-chat | Brand identity kaybı; ROI marjinal |
| `monk.emredogan.com` standalone | emredogan.com'un alt-page'i yeterli |
| Reseller/affiliate programs | Brand integrity risk |

### 13.5 En Güçlü Moat

**Cinematic identity discipline** + **Solo-founder transparency** + **Lumina DNA**.

Bu üçü kopyalanamaz çünkü:
- Identity: 5-stop color system + Geist + #00d2ff + Lumina avatar = belirli bir göz, belirli bir duygu
- Transparency: public eval, public failures, public telemetry = kopya yapan kendini sergiler
- Lumina DNA: 6 farklı paranoid unlock layer, half-overlap avatar, tool-use rendering = pattern complexity copy-paste-resistant

**Moat'ı zayıflatan tehlike:** V4'te identity fragmentation. Subdomain'ler farklı brand kullanırsa → moat çöker.

### 13.6 En Güçlü Founder Identity

**"19 yaş, self-taught, 01:30 bakery shift, monk mode, ship cadence."**

Bu identity 24-36 ay sonra **inanılmaz** olur (yaş 22 → 24, hala monk mode → ICONIC).

V4 sırasında **identity drift olmamalı:**
- Yaş artar ama "self-taught" kalır
- Bakery shift biterse (lise sonrası) → yeni "1:30 reality" anchor lazım
- Monk mode marka olarak kalır

### 13.7 Maksimum Compounding Sistemler

1. `lumina-chat` npm DL — her install = brand impression + Pro funnel
2. /telemetry public — her ziyaret = trust impression
3. /lab experiments — her completion = viral candidate
4. /changelog — her commit = authority impression
5. Auto-tweet 2.0 — her tweet = Twitter follower funnel

Bu 5 sistem sürekli (24/7) çalışır ve **kullanıcı katılımı olmadan** değer üretir. Phase 1-2'de odaklan.

### 13.8 Sürdürülemez Maintenance Burden Sistemleri

1. Cohort program (synchronous time-intensive)
2. Discord moderation (continuous attention)
3. 3+ YouTube series (content burnout)
4. Multi-language i18n (translation upkeep)
5. Enterprise customer success (1-1 relationship)
6. Live build streams (8 saat/hafta production)

Phase 3+ bunlardan **maks 2 aynı anda** aktif.

### 13.9 Minimum Viable Path: Premium Portfolio → Respected AI-Native Engineering Ecosystem

**Cevap:**

```
1. lumina-chat npm publish              (Phase 1, 2 gün)
   ↓
2. Auto-tweet 2.0 multi-format          (Phase 1, 7 gün)
   ↓
3. /telemetry public dashboard          (Phase 1, 4 gün)
   ↓
4. /lab + 3 experiment                  (Phase 2, 14 gün)
   ↓
5. lumina-chat Pro launch               (Phase 3, 21 gün)
   ↓
6. Premium template #1                  (Phase 3, 10 gün)
   ↓
7. Lumina V4 repo-aware tools           (Phase 4, 7 gün)
   ↓
8. Conference talk submission           (Phase 4, 20 saat)
```

**8 milestone. ~85 gün effective coding** (spread over 18 ay).

Her şey diğeri: nice-to-have.

Eğer founder enerjisi sadece bu 8'ini destekleyebilirse → **V4 başarısı** elde edilir. Diğer her şey bonus.

### 13.10 Tek Cümle Operasyonel İlke

> **"Lumina'yı ship et. Adoption'a izin ver. Pro'ya convert et. Geri kalan her şey ya bunu besler ya da zaman çalar."**

Bu cümle Phase 4 sonuna kadar duvarda asılı. Yeni feature ekleneceği zaman bu cümle ile karşılaştırılır:

| Beslenir mi? | Zaman Çalar mı? | Karar |
|---------------|------------------|-------|
| Evet | Hayır | Build |
| Evet | Evet | Defer veya skip |
| Hayır | Hayır | Skip |
| Hayır | Evet | Asla |

---

## ✍️ KAPANIŞ NOTU

Bu doküman, V4 vizyonunun **realistic infazı**dır.

Bir Claude CLI agent:
1. Bu dokümanı baştan sona okur (~1 saat).
2. Phase 1 prompt'unu kopyalar (Bölüm 6.1).
3. Pre-scan yürütür.
4. Sub-PR sırayla execute eder.
5. QC yapar.
6. Commit + push + deploy.
7. 30-gün observation.
8. Phase 2 prompt'una geçer.
9. ... Phase 4 sonunda **dur**.
10. Phase 5 koşulları tutarsa → V4 EXECUTION SYSTEM v2.0 yazar.
11. Aksi takdirde → "Stable mode" — yeni sistem ekleme, mevcut polish + scale.

İnsan müdahalesi sadece:
- Environment vars provision (NPM_TOKEN, SENTRY_DSN, AWS_*)
- Lemon Squeezy product setup (Phase 3)
- External pentest commission (Phase 4 Cloud Lab)
- Conference talk submission (Phase 4)
- Discord setup (Phase 3)

Geri kalan: agent yürütür.

V4'ün **tek başına bir agent tarafından 18-24 ayda execute edilebilir** operasyonel halidir.

İlke: **Slow is smooth. Smooth is fast.**

— Director's Execution Notes
— 16 Mayıs 2026

---

*Bu doküman PORTFOLYO_V4_FUTURE_SYSTEMS.md (strategic vision) tarafından bilgilendirilmiştir ve PORTFOLYO_V3_EXECUTION_SYSTEM.md (V3 operational playbook) pattern'ini takip eder. Stratejik karar gerektiğinde vizyon doc'a başvurulur; operasyonel karar gerektiğinde bu doc authoritative'dir.*
