# PORTFÖY V5 — EXECUTION SYSTEM

> **AI-Native Engineering Operating System**
> Bu doküman bir portfolio roadmap değildir.
> Bu doküman bir varoluş kategorisi tanımıdır.

---

## ⚠️ KIRMIZI ÇİZGİ — V5 NEYİ DEĞİL'dir

V5 aşağıdakilerin **hiçbiri** değildir. Eğer execution sırasında
bu yönlerden birine sapma sinyali görürsen, **STOP** ve doc'a
geri dön.

| V5 değildir | Çünkü |
|-------------|-------|
| Yeni bir AI tool | Generic AI tool dünyası zaten satüre olmuş; bir wrapper daha üretmek kategori sıkışmasıdır |
| ChatGPT / Claude / Perplexity / Cursor / Lovable / V0 / Replit alternatifi | Bunlar zaten var; V5 visitor'ları onlara geri yönlendirmez |
| Generic copilot | Copilot zaten Microsoft / GitHub kategorisidir; oraya oynamaz |
| Prompt wrapper | Prompt engineering layer V4'te zaten kapatıldı |
| "Ask AI" butonu portfolio | Lumina V3 zaten bu sınırı işgal etti; bir alt seviye daha eklemek değer üretmez |
| Generic dashboard sistemi | /telemetry zaten cinematic-grade dashboard; ikinci bir tane gereksiz |
| AI startup demo agresivliği | "Look at our AI" sergileri V4 § 2.3'te zaten yasaklandı |
| Cyberpunk estetiği | Identity sabitleri kırılmaz |
| Fake autonomy theater | Phase 3-4 boyunca özellikle kaçınıldı; V5'te de kaçınılır |
| Noisy motion playground | Motion law değişmedi: cinematic restraint > visual maximalism |

V5'in başarı kriteri **bir özellik kataloğu değil**, bir *kategori
inşası*dır. Ekrana yansıyan her sistem şu testten geçmek
zorundadır:

> **"Bu özellik kaldırılırsa, kullanıcılar özellikle BU siteyi
> arar mıydı?"**

Cevap "hayır" ise → V5'e ait değildir. ChatGPT'de yapılabilen
hiçbir şey V5 kapsamında değildir. Bu kuralın istisnası yok.

---

## 📋 0. KULLANIM TALİMATI

### 0.1 Bu Doküman Kimin İçin?

Bu doküman tek bir okuyucu için yazıldı: **Emre Doğan'ı V5'i ship
ederken yönlendiren AI agent.** Doküman birinci tekil değil,
ikinci tekil yazıldı. Her cümle çalıştırılabilir bir talimat
veya kırılmaz bir kanun olarak okunur.

Doküman üzerinde değişiklik yapma yetkisi sadece Emre'dedir.
Agent yorumlayabilir, sapma sebebini açıklayabilir, alternatif
önerebilir — ama dokümanı yeniden yazamaz.

### 0.2 Sıralama Kuralı

V5 fazları aşağıdaki sırayla execute edilir:

```
Phase 6 (Sensory Awakening)        → ship → 60 gün observation
Phase 7 (Temporal Architecture)    → ship → 60 gün observation
Phase 8 (Cinematic Topology)       → ship → 90 gün observation
Phase 9 (Operational Twin)         → ship → 120 gün observation
Phase 10 (Ambient Intelligence)    → ship → KOŞULLU, çoğunlukla atlanır
```

Her observation süresi mecburi. Skipping = burnout + maintenance
debt. V5'in sürdürülebilirlik kanunu V4'ten daha sertdir çünkü
yüzey alanı büyüdükçe maintenance non-lineer artar.

### 0.3 Agent İşletim Modu

Bir sub-PR başlamadan önce agent:

1. Mevcut faz raporlarını (Sub-PR_*.md) re-read eder
2. Mevcut codebase'i tarar
3. Aşağıdaki "Three-Question Test"i (Bölüm 1.1) çalıştırır
4. Cevap her üç sorudan ikisi "hayır" ise scope'u küçültür ve
   tekrar dener
5. Tek bir atomic commit, tek bir push, tek bir rapor
6. STOP ve approval bekler

NO batching. NO hidden scope expansion. NO architecture
rewrites.

### 0.4 İptal / Geri Alma / Durma Hakkı

Emre herhangi bir anda şunu söyleyebilir:

- "Bu sub-PR'ı durdur" → mevcut iş halifa atılır, branch
  preserved
- "Bu fazı atla" → faz tamamen iptal; sonraki faz başlatılır
- "V5'i dondur" → V4 maintenance moduna geri dönülür, V5'in
  geri kalanı kalıcı olarak deferred

Bu hak agent tarafından sorgulanmaz. Doc savunmaz. Restraint =
özgürlük.

### 0.5 Tek Cümlede V5 Misyonu

> **Tek bir mühendisin inşa ettiğine inanılmaz bir engineering
> ekosistemi yaratmak — ekibi büyütmeden, infra'yı şişirmeden,
> identity'yi bozmadan.**

Bu cümlenin her kelimesi load-bearing. Eğer bir özellik bu
cümlenin hangisini destekliyorsa savunulabilir. Hiçbirini
desteklemiyorsa → V5'e ait değil.

---

## 🧠 1. V5 EXECUTION PHILOSOPHY

### 1.1 The Three-Question Test (Anayasal Geçit)

Her major V5 sistemi shipping'den ÖNCE şu üç testi geçer:

**Soru 1 — Uniqueness:**
> "Bu özellik kaldırılırsa, kullanıcılar özellikle BU siteyi
> arar mıydı?"

Eğer cevap "hayır" → özellik generic AI dünyasında zaten var.
V5'e ait değil. Atla.

**Soru 2 — Emergence:**
> "Bu özellik tek başına anlamlı mı, yoksa anlamı diğer V5
> sistemleriyle bağlandığında mı doğuyor?"

Eğer "tek başına anlamlı" → büyük olasılıkla bir wrapper.
Sadece "ekosistemle bağlandığında anlamlı" cevabı uniqueness'ı
garanti eder. V5'in zekası sistemler ARASI bağlantıdan doğar,
herhangi bir tek özellikten değil.

**Soru 3 — Sustainability:**
> "Bu özelliğin maintenance maliyetini önümüzdeki 24 ay boyunca
> ödeyebilir miyim, ekibi büyütmeden, infra'yı şişirmeden?"

Eğer cevap belirsiz → özellik ya küçültülür ya da deferred
edilir.

**Üç testten ikisi "evet" değilse**, özellik V5 kapsamına
giremez. İstisna yok.

### 1.2 Identity-Native Intelligence Doktrini

V5'in zekası **ekosistemin kendisinden** doğmak zorunda. Dışarıdan
takılan bir AI özelliği değil, ekosistemin organik parçası.

Pratik olarak:

- Lumina herhangi bir generic chatbot olamaz; sadece BU sitenin
  source'una, telemetry'sine, topology'sine bağlı olduğu için
  Lumina'dır.
- Topology görselleştirmesi herhangi bir 3D demo olamaz; sadece
  Emre'nin gerçek AWS infrastructure'ını gösterdiği için
  topology'dir.
- Memory layer herhangi bir storage çözümü olamaz; sadece
  visitor'ın bu sitedeki pacing'iyle bağlı olduğu için
  memory'dir.

Test:
> Bu özelliği başka bir site'ye kopyalasak, aynı değeri taşır mı?

Eğer "evet" → identity-native değil; muhtemelen V5'e ait değil.

### 1.3 Founder Energy Conservation (V4'ten Genişletilmiş)

V4'te 38 saat/ay maintenance hedefi vardı. V5 bu sınırı 50
saat/ay'a yükseltir AMA sadece **ilave 12 saatin %100'ü yeni V5
sistemlerine** gider, V4 maintenance'a değil.

Anlamı:
- Yeni V5 systems = max 12 saat/ay/ortalama
- Mevcut V4 systems (Lumina, Lab, Cloud Lab, Playground) = max
  38 saat/ay (V4 baseline)
- Toplam = 50 saat/ay (mecburi tavan)

50 saatin aşılması → V5'in son fazları (Phase 9-10) **otomatik
olarak deferred**. Manuel karar değil; doc'tan gelen mecburi
durma.

V5 boyunca **iki mecburi off block** planlı:
- Phase 7 ↔ Phase 8 arası: 14 gün off
- Phase 9 ↔ Phase 10 arası: 21 gün off (Phase 10'a girmeden önce
  enerji rezervi şart)

Off blocks **iptal edilemez**. Burnout circuit breaker'ı
tetiklerse Phase 10 atlanır.

### 1.4 Cinematic Restraint Hierarchy

V5'te "more visual" değil "less but louder" prensibi uygulanır.

Hierarchy:

| Seviye | Ne kadar görünür | Ne zaman ship |
|--------|------------------|---------------|
| **L0 - Embedded** | Visitor fark etmez ama altta çalışır (perception fingerprint, scroll velocity tracking, memory) | Default |
| **L1 - Ambient** | Visitor "yumuşak" bir farklılık hisseder (time-of-day cinematic accent, viewport-aware pacing) | Çoğu V5 özelliği bu seviyede |
| **L2 - Surfaceable** | Visitor explicitly etkileşim kurarsa görünür (topology playback, repo intelligence overlay) | Sınırlı sayıda — max 2-3 surface/Phase |
| **L3 - Spectacle** | Visitor anında çarpılır (full WebGPU 3D topology, cinematic camera fly-through) | Phase 8'de SADECE BİR adet, sonra bir daha asla |

L3 spectacle, sitenin tek bir "wow moment"i için ayrılır. Onun
yanına ikinci bir spectacle eklemek = identity dilution.

### 1.5 Topology-as-Narrative Prensibi

V5'in en önemli kavramsal yeniliği: **mimari diyagramlar
durağan değildir**.

Cloud Waste Hunter'ın topology'si bir dosyada hiyeroglif değil,
**oynanabilir bir anlatı**. Visitor:
- Şimdiki haline bakar (Phase 8)
- 6 ay önceki haline geri sarar (Phase 7)
- Bir sonraki major refactor'da nasıl görüneceğini öngörür
  (Phase 9)
- Bunların hepsini cinematic geçişlerle yapar (Phase 6)

Topology, V5'te:
- Bir görsel değil, bir kahraman
- Bir snapshot değil, bir film
- Bir illustration değil, bir telemetry surface

### 1.6 Coherence Over Features

V5 boyunca her yeni özellik şu testi geçer:

> "Bu özellik, mevcut V4 sistemlerinden HANGİSİNE bağlanıyor?
> Bağlanmıyorsa, V5'e neden eklenmesi gerekiyor?"

İzole özellik = generic AI tool kategorisi.
Bağlantılı özellik = identity-native ekosistem.

Örnekler:

| ❌ İzole özellik | ✅ Bağlantılı özellik |
|------------------|----------------------|
| "AI search" | Repo intelligence (Lumina'nın repo-aware tools'una bağlı) |
| "Code explainer" | Architecture playback (commit history + topology'ye bağlı) |
| "Smart recruiter form" | Adaptive recruiter intelligence (visitor'ın site pacing'ine bağlı) |
| "Project visualizer" | Cinematic topology (mevcut /lab/cloud + projeler verisine bağlı) |
| "AI chatbot" | Lumina V4 (zaten var; V5'te şişirilmez) |

### 1.7 The "Compelled to Contact" Standardı

V5'in başarısı sayfa ziyaretiyle değil, **iletişim isteğiyle**
ölçülür.

Spesifik hedef: Phase 6-9 boyunca her bir fazın sonunda, organik
gelen recruiter / CTO / founder iletişim oranı %25 artar
(baseline: V4 sonu).

Eğer artmıyor → faz başarılı değil, **sonraki faz başlatılmaz**.
"Daha fazla özellik" çözüm değil; ya mevcut özellikler kötü
iletişim sinyali veriyor, ya başlama noktası yanlış.

Bu standard, V5'i feature kataloğundan ayıran şeydir. V5 bir
**arama yüzeyi** değil; bir **çağrı çekme yüzeyi**.

---

## ⚙️ 2. GLOBAL ENGINEERING LAWS (V5 GENİŞLETİLMİŞ)

### 2.1 OSS Publishing Disiplini (V4 Carry-over)

V4 § 2.1 kanunları aynen geçerli. `@emredogan/lumina-chat` ve
`@emredogan/cli` paketleri V5 boyunca da publish edilmeye devam
eder. Yeni paket ship ETMEK için **shipping kanıtı şart**:
mevcut iki paketin haftalık download'ı 100+ olmadan üçüncü paket
ship edilmez.

### 2.2 Telemetry Zorunluluğu (V4 + V5 perception telemetry)

V4'ün telemetry kanunları korunur. V5 şu **yeni telemetry
kategorilerini** ekler:

- **Perception telemetry**: scroll pacing, dwell time per
  section, page-flow sequences. Aggregate-only, no fingerprint.
- **Memory utilization**: visitor session memory cache hit rate,
  expiry distribution.
- **Topology engagement**: which architecture nodes get inspected
  most, which projects' temporal playback is watched.
- **Lumina cognitive load**: avg tools-per-conversation,
  routing decision distribution, sub-agent share.

Her yeni V5 yüzeyi telemetry zorunluluğu ile ship eder. Telemetry
olmadan yüzey ship edilemez — kanunsuz değil, doğrulanamayan
sistem yasak.

### 2.3 Public Transparency Disiplini (V4'ten daha sert)

V4 § 2.3 zaten "her şey public" diyordu. V5 bunu genişletir:

- ✅ Memory contract public (V4'te /lumina/brain'de)
- ✅ Perception telemetry public (V5'te /lumina/brain'e eklenir)
- ✅ Topology playback algoritması public (lib/v5/topology'de)
- ✅ Adaptive recruiter logic public (kara kutu yasak)
- ✅ Eval pipelines per sub-system public
- ❌ Internal-only roadmap **yoktur**; bu doc + V5 FUTURE public

V5'te public transparency BRAND'in kendisi haline gelir.
Visitor sadece ne çalıştığını değil, **neden öyle çalıştığını**
görür.

### 2.4 ⭐ YENİ: Anti-Generic-AI Law

Hiçbir V5 yüzeyi şu özelliklerden birine sahip olamaz:

- Generic "ask AI" prompt input (Lumina dışında)
- Generic "summarize this" buton
- Generic "explain this code" feature
- Generic RAG-over-X document search
- Generic agent autonomy demo
- Generic multimodal upload-and-ask flow

Eğer bir feature aşağıdakilerden BİRİNİ inputs olarak kabul
ediyorsa, V5 reddetir:
- Free-form natural language query (Lumina chat hariç)
- Arbitrary file upload (lab IAM JSON ve commit URL girişleri
  hariç)
- Generic LLM completion request

V5 LLM kullanımı SADECE şu desenlerden birinde olabilir:
1. Lumina conversation (mevcut)
2. Lab experiment (mevcut, kapalı tool surface)
3. Eval / summarization (offline, fire-and-forget)
4. Telemetry interpretation (operational console için)

Hiçbir generic LLM chat surface eklenmez.

### 2.5 ⭐ YENİ: Cinematic Pacing Law

V5'te animasyon ve geçişler, **emotional pacing engine** olarak
düşünülür, görsel süs olarak değil.

Kurallar:

- Her yeni animasyon **reduced-motion safe** + **mobile idle CPU
  ≤ 0.3%** olmalı
- Hiçbir page-load 300ms intro animation ile beklemez —
  cinematic UX = HIZLI hissettiren restraint, yavaş hissettiren
  spectacle değil
- Spring physics yasak (V4 § 2.12'de ban edildi, V5'te tekrar
  vurgulanır) — ease-out curve + duration discipline tercih
  edilir
- Her sayfanın cinematic kimliği "ne kadar hareket eklediği" ile
  değil, "doğru yere yerleştirilmiş tek bir hareket" ile
  ölçülür

### 2.6 ⭐ YENİ: Memory-as-Documentation Law

V5'in en önemli mimari yeniliği: **sistemler kendi tarihlerini
yazar**.

- Her major mimari kararın gerekçesi commit history'de (V4'te
  bu zaten WHY paragraph disiplini ile yapıldı)
- Her topology değişikliği temporal playback için preserved
- Her failure mode `/lumina/failures` corrections log'unda
- Her experimentation cycle eval script'leriyle versioned

Pratik: V5 hiçbir wiki, hiçbir internal doc, hiçbir Confluence
sayfası kullanmaz. Source code + telemetry + commit history
yeterlidir.

### 2.7 Bundle ve Performance Bütçesi (V5 Genişletilmiş)

V4'ün bütçesi:
- 180 KB initial gz, 250 KB hard

V5 bunu **korur** AMA şu eklemeleri yapar:

| Metric | Hedef | Hard Limit |
|--------|-------|-----------|
| `/v5/*` route LCP | < 1.5s | < 2.5s |
| Cinematic topology page (Phase 8) | < 2.0s | < 3.0s |
| Perception telemetry overhead | < 100 ms/page | < 250 ms/page |
| Memory cache cold read | < 50 ms | < 150 ms |
| Lumina V5 ambient awareness | < 200 ms tool spike | < 500 ms |
| Adaptive recruiter interface | < 1.0s | < 2.0s |

Hiçbir V5 yüzeyi global bundle'ı şişirmez. Cinematic topology
WebGPU şart koşulduğu route'ta SADECE quarantined.

### 2.8 Hydration Safety (V5 Critical)

V5'in perception layer'ı browser-side state'e bağımlı (scroll
velocity, dwell time, viewport context). Hydration safety V4'ten
çok daha kritik:

- Server'da neutral default state render edilir
- Mount sonrası gerçek perception state initialized olur
- `suppressHydrationWarning` SADECE time-of-day, perception
  metric, ve random-seed elementlerinde
- Hiçbir SSR'da görünmeyen UI element hydration sonrası
  "fırlamaz"; transition smooth olmalı

### 2.9 Edge Runtime Tercihleri (V5 Devam)

V4'ün edge tercihleri korunur. V5'te:

- ✅ Perception telemetry edge (low-latency yazma kritik)
- ✅ Memory cache reads edge
- ✅ Lumina V5 ambient awareness edge
- ⚠️ Cinematic topology (WebGPU) — runtime'sız (pure client-side)
- ⚠️ Repository intelligence (Octokit) — nodejs
- ⚠️ Temporal architecture playback — nodejs (heavier compute)

### 2.10 Observability ve Cost Monitoring (V5 Genişletilmiş)

V4'ün cost monitoring'i korunur. V5 şunu ekler:

- Per-experiment cost trace (Phase 5'te kuruldu, V5'te
  enhanced)
- Cumulative LLM cost dashboard surface (private, Emre's eyes
  only — internal `/admin/cost` route, env-gated)
- Daily cost alert threshold: > $20/day → Emre'ye email
- Weekly cost projection: > $500/month projeksiyonu → Phase
  pause

Cost dashboard EXTERNAL view'a açılmaz. Visitor'ın "ne kadar
yandı" sorusu için /telemetry yeterli.

### 2.11 Lumina DNA Tutarlılığı (V5 Genişletilmiş)

V4'ün Lumina invariants'ı korunur. V5 şu yeni invariants'ı
ekler:

- ✅ Lumina V5 ambient awareness: visitor session pacing'i okur
  ama ASLA bir greeting'de mention etmez ("noticed you spent 8
  minutes on architecture..." YASAK; "fastest way to see X
  work is..." OK)
- ✅ Sub-agent registry max 2 agent (V4'te 1, V5'te +1 max =
  toplam 2; daha fazla yasak)
- ✅ Memory layer 8-turn cap + 14-gün TTL + tighter PII
  redaction — değişmez
- ✅ "Operator console intelligence" voice'u **kırılmaz**

### 2.12 Animation Performance (V5 Critical)

V4 § 2.12'nin kuralları korunur, **eklenenler**:

- ✅ Temporal architecture playback animation idle ≤ 0.3% CPU
- ✅ Cinematic topology WebGPU SADECE o route, idle frame
  sayısı 0
- ✅ Perception-aware UI breath (Phase 6): max 0.1% idle CPU
- ✅ Hover-driven topology zoom: max 16ms frame budget
- ✅ Sub-second cinematic transitions sadece spatial-navigation
  context'inde

### 2.13 V5 Spesifik Telemetry Schema

V4 schema korunur. V5 şu key pattern'lerini ekler:

```
v5:perception:<surface>:<metric>:<bucket>
v5:memory:<system>:<event>
v5:topology:<project>:<frame>:<state>
v5:lumina-v5:<dimension>:<value>
v5:recruiter:<segment>:<event>
```

Örnek:
- `v5:perception:architecture:dwell_time:p95` → number
- `v5:memory:session:cache_hits:weekly` → number
- `v5:topology:cwh:frame_v0_3_0:nodes` → number
- `v5:lumina-v5:context_seeded:rate` → percentage
- `v5:recruiter:senior_eng:cta_engagement:hourly` → number

### 2.14 ⭐ YENİ: Time-as-Surface Law

V5'te zaman, **birinci sınıf UI primitive**'idir.

- Sayfa zaman skala'sı bilir (Phase 7): /architecture pages
  show timeline slider
- Lumina V4'te zaten time-of-day aware; V5'te + sezonal +
  hafta-bazlı pattern
- Telemetry chart'ları zaman-zoom destekler (saat / gün / hafta
  / ay)
- Topology playback zaman ile drag edilebilir

Zaman bir filtre değil, bir DİL.

### 2.15 ⭐ YENİ: Identity-Native Intelligence Law

V5 boyunca eklenen her AI sistemi şu 3 koşulu sağlar:

1. **Ekosistem-bağımlı**: Sistem, sadece BU ekosistem'in
   verileri / topology'si / memory'si üzerinde anlamlı çalışır
2. **Ekosistem-fed**: Sistem dış kaynak (web search,
   public LLM API'sı) yerine kendi telemetry'sini ve repo
   state'ini input alır
3. **Ekosistem-emergent**: Sistemin değeri başka bir V5
   sistemine bağlandığında belirginleşir; izole çalışmaz

Bu kanun sub-PR review'larda explicit olarak doğrulanır.

### 2.16 Sunset Disiplini (V4'ten Carry-over)

V4 § 2.14'ün sunset kuralları korunur. V5'te şu eklenir:

- Phase 5'ten kalan playground experiments: 90 gün adoption < 50
  unique visitor/ay ise → archive (registry'den status:
  "archived")
- Sub-agent (architecture-critic) routing rate < 5% ise → sub-
  agent kalkmaz ama routing heuristic gözden geçirilir
- Lumina tool invocation rate < 10/ay olan tool → 6 ay sonra
  archive

---

## 🔬 3. PRE-EXECUTION ANALYSIS

### 3.1 Mevcut Durum (V1 → V4 Özet)

V5'in başladığı **kesin yapısal durum**:

#### V1 (Phase 0)
- Cinematic identity kuruldu
- Manuel project case studies
- Static portfolio

#### V2 (Phase 1)
- /telemetry public dashboard
- Auto-tweet 2.0
- OSS launch: `@emredogan/lumina-chat`, `@emredogan/cli`
- Sentry + sponsors
- Changelog feed

#### V3 (Phase 2)
- /lab public experiments (4 adet: IAM Translator, Prompt
  Rescuer, Commit Narrator, CLI showcase)
- Notes 2.0 (audio + diagrams)
- Codex hidden archive

#### V4 Phase 3 (AI-Native Operator Systems)
- Lumina V3 operator awareness (3 telemetry tools)
- Lumina V3 lab invocation (3 lab loopback tools)
- Persistent memory + Forget-Me + 8-turn cap + summary
- Sticky TTS toggle
- /lab/cloud (educational STS pattern)

#### V4 Phase 4 (AI-Native Operating Layer)
- Public Lumina transparency: /lumina/brain + /lumina/failures
- Repo-aware tools (readSourceFile, explainCommitRationale,
  diffArchitectures)
- Eval + telemetry expansion (13-tool consistency eval)
- Memory refinement: opt-out toggle, IPv4/TC Kimlik/API key
  redaction
- Sub-agent (architecture-critic) + heuristic router

#### V4 Phase 5 — Priority A (Experimental Foundation)
- Playground namespace + triple-gate access
- Isolation infrastructure (capabilities, lazy-load,
  ExperimentMount)
- Feature-flagged experiment shells (hello-playground
  diagnostic)
- Per-experiment funnel telemetry

### 3.2 V5 Tier-Based Priority

V4'ün tier sistemi V5'te aynen geçerli (Tier A/B/C). V5'in
tier'ları:

**Tier A — Foundation (Phase 6)**
- Sensory awakening: perception telemetry, scroll pacing,
  cognition-aware navigation primitives
- Tüm V5 sistemleri bunun üzerine kurulur

**Tier A — Temporal (Phase 7)**
- Temporal architecture playback
- Time-as-surface implementation
- Architecture timeline slider

**Tier B — Topology (Phase 8)**
- Cinematic topology shipping (ONE WebGPU spectacle)
- Engineering aura system
- Adaptive recruiter intelligence

**Tier B — Twin (Phase 9)**
- Operational digital twin
- Repository intelligence overlay
- Living engineering journal

**Tier C — Ambient (Phase 10) — CONDITIONAL**
- Lumina V5 ambient awareness
- Cognition-aware Lumina conversation seeding
- May never ship

### 3.3 V5 Speculative System Detection

Şu sistemler V5'e DAHİL EDİLEMEZ (Phase 10+ veya hiç):

| Sistem | Sebep | Karar |
|--------|-------|-------|
| Distributed agent mesh | V4 hard-forbid; V5'te de yasak | Hiç |
| Autonomous remediation | Security incident riski büyük | Hiç |
| Voice wake-word | Privacy + permission UX karmaşık | Hiç |
| 5+ sub-agent registry | Maintenance şişer | Hiç |
| Real-time SSE dashboard | /telemetry yeterli | Hiç |
| Subdomain federation | Path-based başarı yeterli | Phase 11+ veya hiç |
| Generic multimodal upload-and-ask | Generic AI tool kategorisi | Hiç |
| Public Bedrock-against-visitor's-account | Security review ağır | Phase 11+ |
| Anything user can do in ChatGPT | Anti-generic-AI law | Hiç |

### 3.4 Risk Analysis

V5'in en yüksek riski **scope creep**. Her phase için
explicit "scope cut Phase başında" disiplini:

| Phase | Scope cut riski | Mitigation |
|-------|-----------------|------------|
| 6 | Perception layer "kişiselleştirme" gibi yorumlanabilir | Audit: hiçbir yüzey "you've been..." dilini kullanamaz |
| 7 | Timeline slider over-engineered olabilir | Cap: max 5 architectural snapshot/project, video gibi değil |
| 8 | WebGPU spectacle herşeyi kaplamaya başlayabilir | Cap: SADECE 1 sayfada, 1 view, idle 0% CPU |
| 9 | Operational twin "real-time dashboard" gibi yorumlanabilir | Cap: ISR 1h, polling yok |
| 10 | Lumina V5 ambient awareness "creepy" hissettirebilir | Audit: visitor explicit opt-in zorunluluğu, opt-out prominent |

---

## 🏗️ 4. PLATFORM PHASE ARCHITECTURE

Phase numaraları V4'ün devamı: Phase 6'dan başlar. V4'ün Phase
5'i ile karışmasın diye dikkat.

```
V4 Phase 1 ────  V2 (OSS Launch)
V4 Phase 2 ────  V3 (Public Engineering Lab)
V4 Phase 3 ────  V3.5 (AI-Native Operator Systems)
V4 Phase 4 ────  V4 (AI-Native Operating Layer)
V4 Phase 5 ────  V4.5 (Experimental Foundation)

V5 Phase 6 ───  Sensory Awakening
V5 Phase 7 ───  Temporal Architecture
V5 Phase 8 ───  Cinematic Topology
V5 Phase 9 ───  Operational Digital Twin
V5 Phase 10 ── Ambient Intelligence (CONDITIONAL)
```

---

### 4.1 PHASE 6 — SENSORY AWAKENING

**Süre:** 60-90 gün
**Tipi:** Foundation layer for V5
**Risk Seviyesi:** ORTA
**Leverage Skoru:** 9/10 (her sonraki faz buna bağımlı)

#### Mission

Siteyi *algılayan* bir yüzeye dönüştürmek. Visitor'ın okuma
pacing'ini, scroll velocity'sini, hangi sayfaya hangi sırada
gittiğini SİTE FARK EDER. Bu farkındalık visitor'a hiçbir
zaman explicit olarak söylenmez; sadece sistemin ALTında
çalışır ve sonraki fazların dayanağı olur.

**KIRMIZI ÇİZGİ:** Visitor'a "noticed you spent 8 minutes on
X" gibi creepy mesajlar verilmez. ASLA. Bu kural Phase 6
boyunca her sub-PR'da explicit doğrulanır.

#### Strategic Outcome

Phase 6 sonunda:
- Perception telemetry layer canlı (aggregate-only,
  privacy-safe, opt-out destekli)
- Cognition-aware navigation primitive'leri kuruldu
- Cinematic pacing engine entegre
- Memory layer V5'e hazır (V4'ten genişletilmiş)
- Identity-native intelligence law tüm sub-PR'larda doğrulanmış

#### Systems Introduced

| Sistem | Tier | Kaynak |
|--------|------|--------|
| Perception telemetry layer | A | Yeni: `lib/v5/perception/` |
| Cognition-aware navigation primitives | A | Yeni: `lib/v5/navigation/` |
| Cinematic pacing engine | A | Yeni: `lib/v5/pacing/` |
| Memory layer V5 (extended TTL, richer indexes) | A | Genişletme: `lib/lumina/memory.ts` |
| /v5/perception public transparency page | A | Yeni: `app/v5/perception/page.tsx` |

#### Systems Postponed

- Per-visitor personality detection (Phase 5+ yasak, V5'te de
  yasak — "emotional adaptation" Phase 10'a even conditional
  değil)
- Cross-device session linking — privacy backlash riski
- Real-time perception dashboard — operator için /telemetry
  yeterli

#### Sub-PR Maps

(Bölüm 5.6'da detaylı haritalama)

#### Maintenance Cost

| Sistem | Aylık saat |
|--------|------------|
| Perception telemetry | 2 |
| Memory V5 (V4'ten devralanın üzerine) | 1 |
| Cinematic pacing engine | 1 |
| Transparency page güncellemeleri | 0.5 |
| **Toplam** | **4.5 saat/ay** |

#### Burnout Risk

**Düşük.** Phase 6 yapısal; visible yüzey küçük. Maintenance
yükü hafif.

#### Rollback Plan

Her Phase 6 sub-PR feature-flagged değil — perception layer
opt-in OLUYOR (visitor cookie-set ile aktif olabilir, default
inactive). Sorun: flag-off → perception primitives no-op, V5
fazları için "yok" gibi davranır.

---

### 4.2 PHASE 7 — TEMPORAL ARCHITECTURE

**Süre:** 90-120 gün
**Tipi:** Time-as-surface implementation
**Risk Seviyesi:** ORTA-YÜKSEK
**Leverage Skoru:** 9/10 (Phase 8'in dayanağı)

#### Mission

Mimari yüzeyleri ZAMAN ile geçilebilir hale getirmek. Cloud
Waste Hunter'ın architecture diagram'ı durağan değil — visitor
v0.1'den v1.0'a kadar evolution'unu izleyebilir. Bu evolution
gerçek commit history'den + topology metadata'sından inşa
edilir; fake değil, hiçbir manual content değil.

#### Strategic Outcome

Phase 7 sonunda:
- 3 production project (CWH, VibingCoderAI, sixpack-ai) için
  temporal architecture playback canlı
- Timeline slider primitive'i ship
- /architecture/<project> sayfası time-aware
- Time-as-surface law tüm UI'da uygulanmış

#### Systems Introduced

| Sistem | Tier | Kaynak |
|--------|------|--------|
| Temporal playback primitive (frame interpolation) | A | Yeni: `lib/v5/temporal/` |
| Timeline slider component | A | Yeni: `components/v5/Timeline*.tsx` |
| Architecture snapshot manifest format | A | Yeni: `data/v5/architecture-frames/` |
| /architecture/<slug> time-aware page | A | Genişletme |
| Snapshot generator script | A | Yeni: `scripts/generate-architecture-frames.mjs` |

#### Systems Postponed

- Auto-generated architecture frames from raw infrastructure
  (Phase 9 — operational twin'in işi)
- Visual diff between frames (Phase 8 cinematic topology'nin
  işi)
- Public commit-to-frame mapping API — internal yeterli

#### Maintenance Cost

| Sistem | Aylık saat |
|--------|------------|
| Snapshot manifest manuel güncellemesi | 2 |
| Timeline slider tweaks | 1 |
| Snapshot generator script bakımı | 0.5 |
| **Toplam** | **3.5 saat/ay** |

#### Burnout Risk

**Düşük.** Snapshot manifest manuel ama nadiren güncellenir
(major refactor'lar arası 2-4 ay).

#### Rollback Plan

Timeline slider opsiyonel UI; default state = en son snapshot
gösterimi (V4 davranışı). Slider gizlenirse architecture page
V4 gibi davranır.

---

### 4.3 PHASE 8 — CINEMATIC TOPOLOGY

**Süre:** 120-180 gün
**Tipi:** ONE spectacle, route-isolated
**Risk Seviyesi:** YÜKSEK (WebGPU + performans)
**Leverage Skoru:** 8/10

#### Mission

Tek bir yüzeyde — `/v5/topology/<project>` — Emre'nin gerçek
AWS infrastructure'ını **dolaşılabilir 3D mekân** olarak ship
etmek. Bir wow-moment. Phase 8'in maxim'i: **"max bir
spectacle, sonra bir daha asla"**.

Bu spectacle:
- WebGPU shader bazlı (CPU fallback Three.js fiber)
- Spatial audio opsiyonel (off by default, opt-in toggle)
- Reduced motion'a saygılı (static 2D fallback)
- Mobile'da degrade ediliyor (touch nav + simplified topology)

#### Strategic Outcome

Phase 8 sonunda:
- 1 production project için cinematic topology canlı
- WebGPU quarantined chunk, global bundle etkilenmemiş
- Engineering aura system entegre (page-specific perceptual
  fingerprint)
- Adaptive recruiter intelligence interface
- 1 "I have no idea how he built this" moment

#### Systems Introduced

| Sistem | Tier | Kaynak |
|--------|------|--------|
| Cinematic topology renderer (WebGPU + Three.js fallback) | B | Yeni: `lib/v5/topology/`, `app/v5/topology/<slug>/` |
| Engineering aura system | B | Yeni: `lib/v5/aura/` (per-page perceptual fingerprint) |
| Adaptive recruiter intelligence | B | Yeni: `app/contact/_adaptive/` |
| Spatial audio (optional, off by default) | B | Genişletme: ElevenLabs spatial layer |

#### Systems Postponed

- Multi-project topology comparison view — overkill
- VR / WebXR support — niche
- Live infrastructure poll for topology — Phase 9 operational
  twin'in işi

#### Maintenance Cost

| Sistem | Aylık saat |
|--------|------------|
| WebGPU renderer bakımı (browser updates, regressions) | 3 |
| Topology snapshot guncellemesi | 1.5 |
| Aura system tuning | 0.5 |
| Adaptive recruiter tweaks | 1 |
| **Toplam** | **6 saat/ay** |

#### Burnout Risk

**Yüksek.** WebGPU bakımı tam ağrılı; browser updates'lerde
beklenmedik regressions çıkabilir. Phase 8 öncesi mecburi 14
gün off.

#### Rollback Plan

Topology page'i tek route'da. Bug çıkarsa:
- Flag-off: page returns 404 (V5 § 5.1.x'te feature flag)
- Static 2D fallback: WebGPU sırlanırsa 2D SVG topology görünür
- Tam revert: tek commit revert; diğer sayfalar etkilenmez

---

### 4.4 PHASE 9 — OPERATIONAL DIGITAL TWIN

**Süre:** 120-180 gün
**Tipi:** Engineering life'ı bir yüzey olarak
**Risk Seviyesi:** ORTA
**Leverage Skoru:** 9/10 (V5'in en güçlü uniqueness sinyali)

#### Mission

Emre'nin gerçek mühendislik yaşamının **canlı bir twin'ini**
ship etmek: bu hafta neyi shipping etti, hangi infrastructure
canlı, hangi experiment runs, hangi commit'ler son 24 saatte
indi. Bu BIR FEED DEĞİL. Bir **operational portrait**. Visitor
bunu okurken "engineering life'ın bir snapshot'ı" hissini alır.

Phase 9 visitor'a şunu söyler implicit olarak: **"Bu kişi
gerçekten ne yapıyor, gözünün önünde."**

#### Strategic Outcome

Phase 9 sonunda:
- /v5/operating canlı yüzey: this-week shipped + active
  infrastructure + running experiments + planned-next
- Repository intelligence overlay (Phase 4'ün repo-aware
  tools'unun extended UI'sı)
- Living engineering journal: auto-generated weekly digest
- Operational portrait card (recruiter share için optimized)

#### Systems Introduced

| Sistem | Tier | Kaynak |
|--------|------|--------|
| Operational twin route | B | Yeni: `app/v5/operating/page.tsx` |
| Repository intelligence overlay | B | Yeni: `lib/v5/repo-intelligence/` |
| Living engineering journal | B | Yeni: `app/v5/journal/page.tsx`, weekly cron |
| Operational portrait card | B | Yeni: OG image generator extension |

#### Systems Postponed

- Real-time deployment tracking — ISR 1h yeterli, polling
  yasak
- Multi-account AWS state view — security review ağır
- Public commit firehose — /changelog yeterli

#### Maintenance Cost

| Sistem | Aylık saat |
|--------|------------|
| Operational twin data pipeline | 2 |
| Living journal cron + content | 2 |
| Repository intelligence tuning | 1 |
| Portrait card OG iteration | 0.5 |
| **Toplam** | **5.5 saat/ay** |

#### Burnout Risk

**Orta.** Living journal cron'u manuel müdahale gerektirebilir;
editorial discipline gerekli. Phase 9 ↔ Phase 10 arası MECBURI
21 gün off.

---

### 4.5 PHASE 10 — AMBIENT INTELLIGENCE (CONDITIONAL)

**Süre:** 180+ gün, opsiyonel
**Tipi:** Lumina V5 ambient operator presence
**Risk Seviyesi:** ÇOK YÜKSEK
**Leverage Skoru:** 6-9/10 (volatile)

#### Mission

Lumina V5: visitor'ın mevcut session pacing'ini (Phase 6
perception) kullanarak conversation context'i **seed eder**.
Visitor 8 dakika /architecture'da kaldıktan sonra Lumina'ya
yazdığında, Lumina'nın internal context'i bunu "biliyor" ama
**asla mention etmiyor**.

Anlamı: Lumina cevapları daha specific, daha hızlı doğru
noktaya gidiyor. Visitor "wow nasıl bildi" hissetmiyor;
"konuştuğum kişi konuyu anlıyor" hissediyor.

#### Phase 10 Tetikleme Koşulları (Hepsi Zorunlu)

Phase 10 başlamaz, eğer:

1. Phase 9 sonu MRR ≥ $10K, 6 ay devamlı
2. Phase 8 cinematic topology load failure rate < %1, 90 gün
3. Phase 6 perception layer privacy backlash 0, 6 ay
4. Founder energy yeşil 90 gün (V5'in en sert eşiği)
5. Lumina V4 sub-agent (architecture-critic) routing rate > %5

Eğer 1 koşul tutmuyorsa → Phase 10 **execute edilmez**, V5
biter ve V5 systems polish + scale moduna geçilir. **Bu başarısızlık
değildir.**

#### Strategic Outcome (Yapılırsa)

- Lumina V5 ambient awareness canlı
- Cognition-aware conversation seeding
- Identity-native intelligence law'ın final manifestation'ı
- "I've never seen a website behave like this" tepkisi

#### Critical Caveat

Phase 10 **may never execute**. V5 sonsuza kadar Phase 6-9'da
kalabilir. Bu **disciplined product evolution**'dur.

#### Burnout Risk

**Yıkıcı potansiyel.** Phase 10 öncesi:
- Mecburi 21 gün off
- Part-time contractor olmadan başlatılmaz
- Maintenance budget 70 saat/ay'a yükselir (geri çekilmez)

---

## 🔧 5. SUB-PR EXECUTION MAPS

Her phase 3-6 sub-PR'a bölünür. Her sub-PR independently
deployable.

### 5.1 Phase 6 — Sub-PRs (5 toplam)

#### Sub-PR 6.1 — Perception Telemetry Foundation
**Affected:** Yeni `lib/v5/perception/`, `app/api/v5/perception/`
**Risks:** Privacy backlash; KV cost spike
**Validation:**
- [ ] Aggregate-only, no fingerprint, no per-user identifier
- [ ] Opt-out flag default-off (perception lazy-engaged)
- [ ] Edge runtime
- [ ] Performance overhead < 100ms/page
- [ ] Public transparency page (/v5/perception)
**Dependencies:** Vercel KV
**Performance:** Page render unchanged
**Rollback:** Flag-off → primitives no-op
**Telemetry:** `v5:perception:adoption:opt_in_rate`

#### Sub-PR 6.2 — Cognition-Aware Navigation Primitives
**Affected:** `lib/v5/navigation/`, `components/v5/CognitionAware*.tsx`
**Risks:** Hydration mismatch
**Validation:**
- [ ] SSR-safe defaults
- [ ] Reduced-motion compliant
- [ ] Idle CPU < 0.3%
- [ ] No user-visible behavior change
**Dependencies:** Phase 6.1
**Performance:** No bundle delta on default routes
**Rollback:** Primitive deletion
**Telemetry:** `v5:perception:navigation:cognition_signals`

#### Sub-PR 6.3 — Cinematic Pacing Engine
**Affected:** `lib/v5/pacing/`, `components/v5/PacingProvider.tsx`
**Risks:** Animation regression
**Validation:**
- [ ] Reduced-motion fallback verified
- [ ] Spring physics ban enforced
- [ ] Mobile idle CPU ≤ 0.3%
**Dependencies:** Phase 6.1, 6.2
**Performance:** Bundle delta < 4 KB
**Rollback:** Provider unwrap
**Telemetry:** `v5:pacing:transitions_per_session`

#### Sub-PR 6.4 — Memory Layer V5 (Extended)
**Affected:** `lib/lumina/memory.ts`, `lib/v5/memory/`
**Risks:** Cross-version migration
**Validation:**
- [ ] V4 memory shape backward-compatible
- [ ] PII redaction extended (TC Kimlik + IPv4 already in)
- [ ] TTL configurable (14-30 gün range)
**Dependencies:** V4 memory infrastructure
**Performance:** KV read latency unchanged
**Rollback:** Schema rollback (V4 still readable)
**Telemetry:** `v5:memory:adoption:hit_rate`

#### Sub-PR 6.5 — Public Perception Transparency Page
**Affected:** Yeni `app/v5/perception/page.tsx`
**Risks:** Privacy messaging ambiguity
**Validation:**
- [ ] Public algorithm description
- [ ] What we collect / what we don't / how to opt out
- [ ] Cinematic-grade copy
**Dependencies:** Phase 6.1-6.4
**Performance:** Static prerender, 1h ISR
**Rollback:** Route delete
**Telemetry:** `v5:telemetry:perception-page:visits`

### 5.2 Phase 7 — Sub-PRs (4 toplam)

#### Sub-PR 7.1 — Architecture Snapshot Manifest Format
**Affected:** `data/v5/architecture-frames/`, schema spec
**Risks:** Data format drift, manual update fatigue
**Validation:**
- [ ] TypeScript schema enforced
- [ ] Per-project snapshot list (max 5)
- [ ] Eval consistency script
**Dependencies:** None (V4 project data extends)
**Performance:** Static at build time
**Rollback:** Schema deletion
**Telemetry:** None (build-time only)

#### Sub-PR 7.2 — Temporal Playback Primitive
**Affected:** `lib/v5/temporal/`
**Risks:** Interpolation glitches
**Validation:**
- [ ] Frame interpolation deterministic
- [ ] Reduced-motion → instant snap-to-frame
- [ ] Idle CPU 0% when scrubber inactive
**Dependencies:** Phase 7.1
**Performance:** Bundle < 6 KB
**Rollback:** Primitive deletion
**Telemetry:** `v5:topology:playback:scrub_events_weekly`

#### Sub-PR 7.3 — Timeline Slider Component
**Affected:** `components/v5/Timeline*.tsx`
**Risks:** Touch UX on mobile
**Validation:**
- [ ] Touch + keyboard + mouse all functional
- [ ] WCAG 2.5.5 AAA hit target
- [ ] Reduced-motion: slider remains, animation removes
**Dependencies:** Phase 7.2
**Performance:** SSR-safe; no hydration warning
**Rollback:** Component unmount
**Telemetry:** `v5:topology:timeline:engagement_rate`

#### Sub-PR 7.4 — Architecture Page Time-Aware Integration
**Affected:** `app/architecture/<slug>/page.tsx` extensions
**Risks:** SEO regression
**Validation:**
- [ ] Default view = latest snapshot (V4 behavior preserved)
- [ ] Timeline slider opt-in (visible on viewport > 768px)
- [ ] OG image uses latest snapshot
**Dependencies:** Phase 7.1-7.3
**Performance:** LCP < 1.5s preserved
**Rollback:** Slider removal; page reverts to V4
**Telemetry:** `v5:topology:architecture-page:timeline_engagements`

### 5.3 Phase 8 — Sub-PRs (5 toplam)

(Detayların full şeması ship öncesi sub-PR review'la kesinleşir;
şu an scaffold)

#### Sub-PR 8.1 — WebGPU + Three.js Fallback Renderer Foundation
**Affected:** `lib/v5/topology/`, `app/v5/topology/<slug>/`
**Risks:** Browser compat; WebGPU API churn
**Validation:**
- [ ] WebGPU detection + Three.js fallback
- [ ] Mobile reduced static 2D fallback
- [ ] Idle frame 0
- [ ] Route-quarantined chunk

#### Sub-PR 8.2 — Topology Data Pipeline + 1 Production Project Mount
**Affected:** First project (CWH önerilen) topology canlı

#### Sub-PR 8.3 — Engineering Aura System
**Affected:** `lib/v5/aura/`
**Risks:** Identity dilution
**Validation:**
- [ ] Per-page perceptual fingerprint < 100 ms compute
- [ ] No new visual elements; subtle color temperature shift

#### Sub-PR 8.4 — Adaptive Recruiter Intelligence (Phase 8 sınırında)
**Affected:** `app/contact/`
**Risks:** Creep into personalization theater

#### Sub-PR 8.5 — Spatial Audio (Optional, Opt-In)
**Affected:** ElevenLabs spatial layer
**Risks:** ElevenLabs API cost; mobile autoplay
**Validation:**
- [ ] Off by default
- [ ] Explicit opt-in
- [ ] Mobile mute respected

### 5.4 Phase 9 — Sub-PRs (4 toplam)

(Scaffold; details closer to phase)

- Sub-PR 9.1: Operational twin data layer (this-week shipped)
- Sub-PR 9.2: Repository intelligence overlay
- Sub-PR 9.3: Living engineering journal weekly cron
- Sub-PR 9.4: Operational portrait OG card

### 5.5 Phase 10 — Sub-PRs (3 toplam, CONDITIONAL)

(Sadece tetikleme koşulları yeşilse)

- Sub-PR 10.1: Cognition-aware Lumina conversation seed
- Sub-PR 10.2: Ambient operator awareness (silent context
  injection)
- Sub-PR 10.3: Identity-native intelligence law'ın final
  manifestation'ı

### 5.6 Phase 6 — Sub-PR Detayları (önceki bölümün tekrarı)

(Bölüm 5.1'de detaylı; burada referans tutulur)

---

## 💬 6. PHASE PROMPTS (V5 Operating Instructions)

### 6.1 PHASE 6 PROMPT

```
PHASE 6 — SENSORY AWAKENING başlatılıyor.

ZORUNLU:
1. PORTFOLYO_V5_EXECUTION_SYSTEM.md'yi tümüyle re-read et.
2. PHASE_6 sub-PR map'ini (5.1) re-read et.
3. Three-Question Test'i (1.1) çalıştır.
4. Identity-Native Intelligence Law'ı (2.15) doğrula.
5. Anti-Generic-AI Law'ı (2.4) doğrula.

İLK SUB-PR:
Sub-PR 6.1 — Perception Telemetry Foundation.

KIRMIZI ÇİZGİ:
- "Personalization" gibi kelimeleri kullanma
- Visitor'a perception'ı asla mention etme
- Privacy-first: aggregate-only, opt-in default-off

SONRA:
Sub-PR 6.2, 6.3, 6.4, 6.5 — her biri bağımsız approval ile.

PHASE 6 SONU:
60-90 gün observation. PHASE 7'ye geçmek için
sustainability + privacy backlash 0 olmalı.
```

### 6.2 PHASE 7 PROMPT

```
PHASE 7 — TEMPORAL ARCHITECTURE başlatılıyor.

ÖN KOŞUL:
- Phase 6 tamamlandı + 60 gün observation
- Perception telemetry stable
- Founder energy yeşil

İLK SUB-PR:
Sub-PR 7.1 — Architecture Snapshot Manifest Format.

DİKKAT:
- Snapshot manifest manual güncellenir (auto-generation Phase 9)
- Time-as-surface law (2.14) tüm UI'da uygulanır
- Reduced-motion fallback şart
```

### 6.3 PHASE 8 PROMPT

```
PHASE 8 — CINEMATIC TOPOLOGY başlatılıyor.

ÖN KOŞUL:
- Phase 7 tamamlandı + 60 gün observation
- Mecburi 14 gün off geçti
- Founder energy yeşil

İLK SUB-PR:
Sub-PR 8.1 — WebGPU + Three.js Fallback Renderer.

KIRMIZI ÇİZGİ:
- ONE spectacle, sonra bir daha asla
- Route-quarantined WebGPU
- Mobile static 2D fallback şart
- Reduced-motion = static
```

### 6.4 PHASE 9 PROMPT

```
PHASE 9 — OPERATIONAL DIGITAL TWIN başlatılıyor.

ÖN KOŞUL:
- Phase 8 cinematic topology stable + 90 gün observation
- Privacy backlash 0
- Operational journal editorial workflow planned

İLK SUB-PR:
Sub-PR 9.1 — Operational Twin Data Layer.

DİKKAT:
- Real-time poll YASAK; ISR 1h
- Operational portrait = snapshot, dashboard değil
- Living journal cinematic kısa metin, marketing değil
```

### 6.5 PHASE 10 PROMPT (CONDITIONAL)

```
PHASE 10 — AMBIENT INTELLIGENCE başlatılıyor.

ÖN KOŞUL — TÜM 5 KOŞUL YEŞİL OLMAK ZORUNDA:
1. Phase 9 sonu MRR ≥ $10K, 6 ay devamlı
2. Cinematic topology load failure < %1, 90 gün
3. Perception backlash 0, 6 ay
4. Founder energy yeşil 90 gün
5. Sub-agent routing > %5

Eğer 1 koşul kırmızı → PHASE 10 ATLANIR.
V5 systems polish + scale'a geçilir.
Bu BAŞARISIZLIK değildir.

İLK SUB-PR (eğer geçer):
Sub-PR 10.1 — Cognition-Aware Lumina Conversation Seed.

KIRMIZI ÇİZGİ:
- Visitor'a perception explicit mention edilmez
- Opt-out prominent ve default-on
- "Creepy" hissetiren her şey iptal
```

---

## 🛡️ 7. ROLLBACK PHILOSOPHY

V4'ün rollback disiplini korunur. V5 şu eklemeleri yapar:

- Her V5 yüzeyi en az 1 feature flag arkasında (default-off
  hariç hello-playground gibi proof-of-contract surface'ler)
- Topology page WebGPU başarısızsa otomatik 2D fallback
- Perception layer opt-in default-off
- Sub-agent expansion yapılırsa router fallback to default
  Lumina

V5'in her bir kanunu **kaldırılabilir** olmalı. Hiçbir sistem
"removable değil" düzeyine ulaşmaz; visitor identity'sine
işlenmez.

---

## ♻️ 8. SUSTAINABILITY SYSTEMS

V5 sustainability mecburiyetleri:

| Sistem | Tavan | Aşılırsa |
|--------|-------|----------|
| Toplam maintenance saati | 50 saat/ay | Sonraki phase otomatik defer |
| LLM cost (Bedrock + Anthropic + ElevenLabs) | $500/ay | Phase pause + cost audit |
| Sentry error rate | < 0.5% | Phase pause + incident review |
| Lighthouse mobile median | ≥ 88 | Bug fix öncelikli, faz pause |
| Burnout circuit breaker | 0 trigger | Mecburi 21 gün off |

V5 sustainability **agent tarafından enforce edilir**.
Operator (Emre) doğrudan override edebilir, ama agent'ı
manipüle edemez — agent doc'tan çalışır.

---

## 📡 9. DISTRIBUTION-FIRST PHILOSOPHY

V4'ün distribution disiplini korunur. V5 şu kanunu ekler:

> Hiçbir V5 yüzeyi *sadece* visitor'lara açık değildir.
> Her yüzey aynı zamanda **paylaşılabilir bir artifact** üretir.

Örnekler:
- Cinematic topology'nin static snapshot PNG'si OG için
  available
- Living journal'in weekly digest'i public RSS
- Operational portrait card share-link friendly
- Temporal architecture playback URL'si frame-id'li paylaşılır

V5 distribution = visitor ziyareti değil, **artifact viral
döngüsü**.

---

## 🎯 10. OPERATIONAL LEVERAGE DOCTRINE

V5'in her sistemi şu üç leverage axis'inden en az ikisini
sağlar:

1. **Identity leverage**: Sistem visitor'a "bunu kim yaptı?"
   sorusunu doğal olarak ürettirir
2. **Distribution leverage**: Sistem visitor'ın diğer kişilere
   share etmek istediği bir artifact üretir
3. **Compounding leverage**: Sistem mevcut V4 sistemleriyle
   bağlanır ve onların değerini de artırır

Sistem 3 axis'ten sadece 1'ini sağlıyorsa V5 kapsamına girmez.
İstisna yok.

---

## 🌟 KAPANIŞ

V5'in temel iddiası:

> **Tek bir mühendis, doğru disiplinle, bir kişinin inşa
> ettiğine inanılmaz bir engineering ekosistemi yaratabilir.**

Bu doküman o disiplinin operational manifestation'ıdır. Yaz
boyunca uygulanır, kış boyunca observation, bahar boyunca
revision. V5'in başlama tarihi tek bir Phase 6 sub-PR'ın
shipping anıdır. V5'in bitiş tarihi yok — sistem evolves,
visitor evolves, identity evolves.

Bir noktada V5 V6'ya dönüşür. Ama V6 yazılana kadar V5 tek
geçerli operating sistem'dir.

Son cümle V4'ten doğrudan devralındı, V5'te de geçerli:

> **Distribution > Perfection.**
