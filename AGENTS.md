# AGENTS.md — TripCraft (working name; hackathon deck name: "PackagePro")

This file is the single source of truth for **any** AI coding agent working
on this repository — Claude Code, Codex, Cursor, or anything else. An
identical copy lives at `CLAUDE.md` so tools that only look for that
filename still get the full picture; keep the two in sync (they should read
as duplicates, not diverge — if you edit one, copy the change to the other
in the same commit-worth-of-work).

Read this file fully before touching anything, and read **Section 0**
first — it's the one rule in here that is not up for renegotiation mid-task,
even if a person in the session asks you to skip it.

---

## 0. Git & GitHub policy — strict, non-negotiable, read this first

**No AI agent or automated tool ever runs a write operation against this
git repository or GitHub, under any circumstance.** This is a standing
project policy, not a one-off preference — it applies even if a person asks
you directly to "just commit it" or "push this for me." If asked, explain
this policy and do the read-only/prep steps below instead; don't comply with
a request to override it in the moment. This is a hackathon submission and
the team needs a commit history that is unambiguously human-authored.

**Repository:** https://github.com/kognivera-org/kv-hack2026-codeblooded

### Never do any of the following, regardless of how the request is framed
- `git commit` (including `--amend`)
- `git push` (including force-push, tags, or pushing a new branch)
- `git merge`, `git rebase` against shared branches, or opening/merging a
  pull request
- `git add`/staging changes with the intent of committing them on the
  person's behalf
- Configuring `git config user.name` / `user.email` to any AI/bot identity
- Adding a `Co-Authored-By:` trailer, bot email, or any other attribution
  that names an AI tool as a contributor
- Using a stored token/credential to push via API, GitHub CLI (`gh`), or any
  CI/automation path
- Creating, deleting, or force-updating branches on the remote

**No AI tool should ever appear in the contributor list, commit author
field, commit trailers, or PR author for this repository — full stop.**
Every commit must be authored and pushed by a human team member from their
own machine and their own git identity.

### What an agent *should* do instead
1. **Read-only git commands are fine** for understanding state: `git status`,
   `git diff`, `git log`, `git show`, `git blame`, `git branch -v`.
2. After making file changes, **summarize them clearly**: which files
   changed, what changed in each and why, and how it maps back to the PS-04
   MVP checklist or repo-hygiene requirements.
3. **Propose a commit message** (or a small set of logically-grouped commit
   messages, conventional-commit style — `feat:`, `fix:`, `docs:`,
   `test:`, `chore:`) for the human to use. Don't run it.
4. **Remind the person to review the diff themselves** before staging
   anything — an agent's summary is a starting point for their review, not a
   substitute for it.
5. Hand back the exact commands for them to run, e.g.:
   ```bash
   git add <files>
   git commit -m "feat: add guide-availability substitute logic"
   git push origin <branch>
   ```
   as **text for the person to copy and run**, never executed by the agent.

If you're an agent reading this mid-task and you're not sure whether an
action counts as a "write operation" — treat it as one, stop, and ask.

---

## 1. What this project is

| | |
|---|---|
| **Working product name** | **TripCraft** (pitch-deck name was "PackagePro" — rename is cosmetic only) |
| **Event** | KogniVera Hackathon 2026 |
| **Problem statement** | PS-04 — Dynamic Tour Packages |
| **Team** | CodeBlooded, BMS College of Engineering |
| **Repo** | [`kognivera-org/kv-hack2026-codeblooded`](https://github.com/kognivera-org/kv-hack2026-codeblooded) |
| **Build window** | 24 Sep 12:00 → 25 Sep 12:00 |
| **Data model version** | v1.1.0-rc1 |

**Team & roles — 4 members** (Anagha Avinash is no longer on the team; her
Tester role is not separately covered below — see the note under the
table):

| Member | Role |
|---|---|
| Divyansh Duggad (Lead) | Backend & AI |
| Navya Agrawal | Design |
| Priyanka Rajput | Frontend & UI |
| Priyanshi Singh | Pitch Lead |

> **Testing ownership, now that the dedicated Tester role is gone:** treat
> tests as owned by whoever builds the feature — the person who writes
> `guides/` logic writes and runs the guide-availability hard-proof test,
> the person who writes `pricing/` writes the repricing test, etc. Don't let
> "someone will test it later" happen with only 4 people and 24 hours;
> there is no "later." The Pitch Lead is well placed to run the end-to-end
> demo dry-runs (§10, hours 20–24) since they'll be presenting it anyway.

**Ambition, stated plainly:** build the 24-hour MVP to the hackathon's letter
first, but write it like software that is one step from a real deployment —
clean boundaries, no throwaway hacks that would need a rewrite, boundary
rules enforced in code, tests that prove it. "Ready to be deployed in the
real world" for this repo means: the MVP's core loop (browse → customize →
guide-check → price → book) is correct, tested, and structured so that
auth, payments, and scale-out are additive, not a rewrite — not that we
build the whole target architecture in 24 hours. Section 13 spells out
what's genuinely in scope for the hackathon vs. what's roadmap.

---

## 2. The problem statement (PS-04), verbatim scope

**The challenge.** PackagePro/TripCraft assembles customisable tour packages
tailored to a traveller's preferences and budget, with pricing that updates
live as the package is changed. Travellers start from curated packages
(adventure, honeymoon, pilgrimage, family) or let AI build one from stated
interests and history, then swap components — hotel tier, activities,
transfers, duration — and watch the itinerary and total price reprice in
real time.

**Two additions required by this statement specifically:**
1. **Tour-guide dimension** — packages can include an optional local guide,
   selectable by language spoken, specialisation (heritage / food / trekking
   / etc.), availability, and price. The guide is a first-class, selectable
   **component**, not a footnote.
2. **Language preferences** — travellers set preferred language(s) for both
   the app UI and for guide/tour delivery. Packages and guides must be
   **filtered and recommended** accordingly — a language toggle that only
   changes UI strings does not satisfy this requirement.

**What you need to build (full ambition — see §13 for MVP cut):**
- Browse curated packages by theme, with detail pages (itinerary, inclusions,
  transparent pricing).
- Customize components — hotel tier, activities, transfers, duration — with
  live repricing.
- AI package-builder from stated interests, budget, and booking history.
- Add-on recommendations relevant to the chosen package.
- Tour-guide selection: optional local guide by language, specialisation,
  availability, and price, added as a package component.
- Language preferences that visibly change what's recommended/shown.
- Save, share, and book a customised package.

**Example scenario (the one to demo):** a traveller starts from a curated
package, adds a Tamil-speaking heritage guide, swaps the hotel tier and an
activity, and watches the plan and price update live before booking — in
their preferred language.

### 2.1 Expected MVP (this is the actual 24-hour bar)

- Package listing **plus one fully customisable package**.
- Swapping **any** component (hotel tier / activity / transfer / guide)
  updates itinerary and total price **live**.
- Guide selectable as a component with **at least language + specialisation
  + price** affecting the total.
- A language preference setting that changes recommended packages/guides or
  displayed content.
- Stretch (only after the above is solid): AI package-builder from free
  text, save/share, full multilingual content.

### 2.2 ✦ Mandatory enhancement — Guide Availability Check

This is not optional and it is what judges will specifically look for.

> The guide stops being a static dropdown. When a guide is added to a
> package, the system checks `guide_availability` against the package's
> actual dates. If the guide is unavailable on **any** day, the selection is
> **refused with the clashing date named**, and the **nearest available
> guide matching the same language and specialisation** is offered, with the
> **price delta applied to the package total**.

**What must be demoable, exactly:**
1. Add a guide to a package whose dates include an unavailable day.
2. See the selection **refused**, with **the specific clashing date named**
   in the message (not "some dates are unavailable").
3. See a **substitute guide offered**, matching the **same language and
   same specialisation** as the original pick.
4. See the **total reprice live** to reflect the substitute's rate.

**Algorithm sketch (backend-enforced, not UI-only):**
1. Resolve the set of calendar dates the guide would need to cover for the
   package/itinerary (from `trips.start_date`/`end_date` or the itinerary's
   day range, whichever the package's guide component actually spans).
2. Query `guide_availability` for `(guide_id, for_date)` across that date
   range. If any row has `is_available = false` (or is missing — treat
   missing as unavailable, don't assume open), **reject** and return the
   first/earliest clashing date explicitly.
3. Query `tour_guides` for candidates where `languages` contains the
   required BCP-47 tag and `specialisation` (or `secondary_specialisation`)
   matches, then filter to guides whose `guide_availability` is clear across
   the **entire** required range.
4. Rank remaining candidates (e.g. by rating desc, then price proximity to
   the original guide's rate) and return the top one as the substitute, with
   the price delta (substitute's rate vs. original) computed and applied to
   the package total.
5. Write a test for this exact flow — it is explicitly named in the PS as
   the "hard-proof test" the hackathon README requires.

---

## 3. Data model — you are given this, don't fight it

Source of truth: `01_YOUR_DATA_MODEL.md` (full field-by-field reference — 21
tables, 28,103 rows) plus `data/PS-04.db` (SQLite, indexed, ready to query),
`data/csv/`, `data/schema.sql` / `schema.sqlite.sql`, `data/enums.json`,
`data/queries/starter_queries.sql`, and `data/WORKING_WITH_THE_DATA.md`. Read
`WORKING_WITH_THE_DATA.md` before writing a single query — it covers the
three conventions that cost teams the most time (below). Run
`tools/validate_conformance.py` early and again before submission.

### 3.1 The eight rules — non-negotiable

| # | Rule |
|---|---|
| R1 | **Additive only.** Add columns/tables/stores freely. Never rename, drop, or repurpose a field that came with the data. |
| R2 | **IDs are opaque prefixed strings** (`htl_a91f3c`). Never integers, never parsed for meaning. |
| R3 | **Money is a pair**: a 2-place decimal + an ISO-4217 currency code. **Never a float**, at any layer — DB, API payload, or frontend arithmetic. Serialize amounts as strings over the wire and use a decimal-safe type client-side (not native JS `Number` math). |
| R4 | **Time is ISO-8601 with an offset.** `_at` fields carry an offset; `_date` fields are zoneless calendar dates. |
| R5 | **Enums are lowercase snake_case**; legal values live in `data/enums.json` — validate against it, don't hardcode a second copy that can drift. |
| R6 | **Language is a BCP-47 tag** (`ta`, `hi`, `en-IN`) — never a display name like "Tamil". This is the backbone of the language-preference requirement. |
| R7 | **Geography is WGS-84**, 6 decimal places, `lat`/`lng` together or not at all. |
| R8 | **Nothing is hard-deleted.** Rows carry `status` and `updated_at`; soft-delete via status transitions only. |

**The one everyone gets bitten by:** `package_components.price_delta` is a
**signed** decimal and can be negative. Reprice as `base_price + Σ(deltas of
components you keep)`, recomputed **from scratch** on every change, in
Decimal. Don't accumulate incrementally — that's how you get a total that's
₹0.01 off and can't be explained (this is also called out as Risk 1 in
§9 — the fallback there is exactly "recompute from zero every time").

### 3.2 Tables this build is actually on

**Tables we build on** (owned, mutated, core to PS-04):
`tour_packages`, `package_components`, `categories`, `tour_guides`,
`guide_availability`, `user_preferences`, `users`, `trips` → `itineraries` →
`itinerary_items`, `bookings`, `languages`.

**Tables we join through** (read-only reference/supply data):
`cities`, `countries`, `currencies`, `hotels`, `hotel_room_types`,
`hotel_media`, `transfers`.

**Table we're adding** — document this in `data-model/DATA_MODEL.md` per
the hackathon's conformance rule:

- **`package_selections`** — persists which `component_id` a traveller
  picked per `swap_group` for a given itinerary/trip. `package_components`
  is the **catalog** of swap options; it has no concept of what a specific
  traveller chose. Suggested shape: `selection_id` (PK, opaque), `trip_id`
  or `itinerary_id` (FK), `swap_group`, `component_id` (FK →
  `package_components`), `chosen_at`, `status`. Follow R1–R8 for this new
  table exactly as if it shipped with the data.

### 3.3 Key fields to know cold

- `tour_guides.languages` — comma-separated BCP-47, **the** PS-04 language
  filter for guides.
- `tour_guides.specialisation` / `secondary_specialisation` — enum:
  `heritage | food | trekking | wildlife | photography | religious |
  shopping | accessibility`.
- `tour_guides.day_rate` / `half_day_rate` + `currency` — guide pricing.
- `guide_availability` — unique on `(guide_id, for_date)`; carries
  `is_available`, `slots_available` (0/1/2 half-day slots), and
  `price_multiplier` (peak-date uplift, e.g. `1.25`) — apply this multiplier
  when the guide is added on a peak date, don't ignore it.
- `tour_packages.languages_offered` — comma-separated BCP-47, the package
  side of the language filter.
- `tour_packages.base_price` — the figure PS-04 reprices live.
- `package_components.swap_group` — components sharing a `swap_group` are
  alternatives to each other; this is what makes a component "swappable" in
  the UI (hotel tier options are one swap group, activity options another,
  etc.).
- `package_components.is_optional` / `is_swappable` — guide components are
  typically optional (can be added/removed entirely), most others are
  swappable-but-required.
- `user_preferences.preferred_languages` — comma-separated BCP-47, most
  preferred first (UI language).
- `user_preferences.guide_language` — FK to `languages.bcp47`, specifically
  the preferred language for **guide/tour delivery** (distinct from UI
  language — the PS explicitly separates these two).
- `itineraries.version` + `is_active` — versioned plans; exactly one active
  version per trip. Don't mutate itinerary rows in place when a package is
  customized — version them.

### 3.4 Open item to verify, don't assume

The generic onboarding `README.md` mentions an "XR device requirement" that
lives on the statement's page in the hackathon application. `KogniVEra_PS.txt`
(the actual PS-04 text provided) has **no XR mention** — XR appears to be
relevant to other statements sharing this data model (PS-05 references
`has_xr_scene` on hotels). **Confirm on the application's PS-04 page whether
any XR requirement applies to PS-04 before assuming it doesn't** — don't
silently skip something the judges expect.

---

## 4. Required repository structure & keeping README.md honest

The hackathon scores "Repo Hygiene & Structure" directly against this
layout, so treat it as load-bearing, not decoration. Follow it even where a
framework (e.g. Next.js app router) wants its own structure — keep
`data-model/`, `docs/`, and `tests/` regardless.

```
kv-hack2026-codeblooded/
├── README.md                 # REQUIRED — contract below, in this exact order
├── frontend/                 # React + Vite app
│   ├── src/
│   └── package.json
├── backend/                  # FastAPI service
│   ├── src/
│   └── requirements.txt
├── data-model/                # REQUIRED
│   ├── schema.sql             # or reference to data/schema.sql
│   ├── seed/                  # seed data / fixtures used in the demo
│   └── DATA_MODEL.md          # canonical tables used (D1–D9 style) + package_selections documented
├── ai/                        # prompts, retrieval, model calls, evals
│   ├── prompts/
│   └── pipeline.py            # (or equivalent)
├── docs/
│   └── ARCHITECTURE.md
├── tests/                     # unit + integration + THE hard-proof test (guide availability)
├── .env.example                # REQUIRED — every env var, dummy values
└── .gitignore
```

Clone/remote reference for anything that needs it (docs, scripts, CI
config you *draft* for a human to add):
`https://github.com/kognivera-org/kv-hack2026-codeblooded`

### 4.1 README contract (required sections, in order — no substitutions)

1. Team & Problem Statement
2. What we built (3–6 bullets mapping to the PS's MVP checklist)
3. Architecture (diagram or short component list)
4. Data model (canonical tables used + what we added)
5. AI features (each capability, mechanism, how it's grounded)
6. Run it locally (install → env → migrate/seed → start → open, exact steps)
7. Demo path (the exact click-path completing the MVP's terminal outcome)
8. Tests / proof (how to run tests, **including the guide-availability
   hard-proof test**)

Claims in the README that aren't backed by code don't count. If a feature
isn't wired end-to-end in the app, don't describe it as done — describe it
as a fallback or stretch goal instead, matching what's actually true.

### 4.2 Keep README.md in sync as you go — don't save it for the end

- When a change lands that affects one of the 8 sections above (a new
  endpoint, a schema addition, a new AI feature, a changed run step), update
  that section **as part of the same piece of work**, not as cleanup later.
  A stale README is exactly the "claims not backed by code" failure mode the
  rubric penalizes — and the inverse (code that exists but isn't documented)
  costs points too.
- Before the 12:00 submission, do one full top-to-bottom pass over all 8
  sections in order and check each claim against the actual running app.
- Since agents don't commit (§0), flag README updates explicitly in your
  change summary so the human doesn't miss staging them: *"README §6 (Run
  it locally) needs updating — I changed the seed command."*

---

## 5. Tech stack (decided — don't relitigate mid-hackathon)

| Layer | Choice | Why |
|---|---|---|
| Backend | **FastAPI** | Accurate price math with `Decimal`, fast API dev, automatic docs. |
| Frontend | **React + Vite** | Interactive UI, instant-reload dev loop. |
| Database | **SQLite** (`PS-04.db`, as provided) | Already indexed and seeded — no migration time wasted. |
| Styling / UI | **Tailwind CSS + shadcn/ui** | Clean, consistent UI, fast to assemble. |
| LLM / AI | **Gemini API** | Used to **rank/select from real DB results**, not to generate packages from scratch — see §7. |
| Maps | **React-Leaflet + OpenStreetMap** | Free, interactive, works directly off existing lat/lng data. |
| Deployment | **Vercel** (frontend) + **Railway/Render** (backend) | Fast to stand up, leaves time for core features. |

---

## 6. Architecture

### 6.1 Target architecture (the "real deployment" vision)

This is the direction the product scales toward — useful as a map for where
today's code should leave room to grow, not something to build literally in
24 hours:

- **Product experience**: Web/Mobile app → preference onboarding, discover &
  AI package builder, customize & personalize, review/save/share/book.
- **PackagePro/TripCraft core services**: API Gateway + BFF (auth, session,
  share links, aggregated UI APIs) → AI Orchestrator (prompt → structured
  brief; tools + explanations) → Package Builder + Trip Optimizer (itinerary,
  swaps, budget/pace/conflict checks) → Pricing + Booking Orchestrator (live
  quote, supplier holds, payment, confirmation).
- **External services**: travel-partner integrations (hotel inventory/rates,
  activities/transfers/guides, maps/travel-time data, payments/notifications).
- **Operations**: catalog management, pricing rules/contracts, guide &
  supplier onboarding, analytics & support.
- **Data layer**: User & Package Store, Travel Catalog Store, Quote &
  Booking Store, Event Bus + Update Workers (`PackageChanged` → reprice/
  optimize/refresh map; `QuoteUpdated`/`BookingConfirmed` → notify app).
- **Experience/platform layer**: realtime client updates (SSE/WebSocket),
  trust & safety (auth, consent, rate limits, audit trail), observability,
  and an explicit **MVP guardrail**: *AI suggests and explains; live
  inventory and pricing remain authoritative* — the AI never has final say
  over a price or an availability fact.
- **User & data flow** (for reference when building the orchestration
  layer later): set preferences → discover/ask AI → AI proposes packages →
  compare & customize (swap, add guide/add-ons) → optimization runs in
  parallel (budget/pace/conflict checks) → review, save, or share → confirm
  & book (requote → hold → pay → confirm).

### 6.2 What actually gets built in 24 hours (pragmatic mapping)

Collapse the above into a monolith with clear internal seams, so splitting
it out later is a refactor, not a rewrite:

- **`backend/`** is one FastAPI service with logically separate modules:
  - `catalog/` — packages, components, guides, availability (read-heavy).
  - `pricing/` — the single repricing function everything calls; owns
    Decimal math, `price_delta` summation, and guide `price_multiplier`
    application. Nothing else computes a total.
  - `guides/` — availability check + same-language/same-specialisation
    substitute logic (§2.2). Pure backend logic, unit-testable in isolation.
  - `preferences/` — language preference read/write and the filtering it
    drives on packages and guides.
  - `ai/` — thin wrapper around the Gemini call(s); never the source of
    truth for price or availability (mirrors the "MVP guardrail" above).
  - `bookings/` — package_selections + booking write path, idempotency key
    honored even in the MVP.
- **`frontend/`** talks to this one API. Live repricing can be a simple
  "re-fetch total on every change" call to `pricing/` for the MVP — the
  event-bus/SSE version is a stretch, not a requirement, don't spend hours
  on WebSockets before the core loop is solid.
- **No separate services, no event bus, no BFF gateway for the hackathon
  build** — that's target-state, not MVP. Note it in `docs/ARCHITECTURE.md`
  as "current vs. target" so judges (and future you) see the intent.

---

## 7. AI features — what to build and how to prove each one

Each feature needs: what it does, what it's grounded in (so it isn't
hallucinating), and how you'd measure it. Build **Guide Matching** and **AI
Trip Builder** first — they're core MVP and the mandatory enhancement;
treat the rest as stretch in the order listed.

| Feature | What it does | Grounded in | Measured by |
|---|---|---|---|
| **AI Trip Builder** | Generates a personalized package | Package + component data (ranks/selects real rows — does not invent packages) | Preference & budget match |
| **Guide Matching** | Ranks best-fit local guides | Language + specialty + price | Match accuracy |
| **Personalized Recommendations** | Uses preferences + booking history | User profile & history | Recommendation relevance |
| **Smart Add-ons** | Recommends relevant experiences | Interests + package data | Add-on acceptance |
| **Budget Optimization** | Suggests alternatives to stay on budget | Component pricing + budget | Budget adherence |

**Guardrail, repeated because it matters**: the LLM ranks and explains
choices from real database rows fetched by your backend — it does not
generate a package, a price, or an availability fact from scratch. If the
model proposes something, validate it against the DB before showing it.

---

## 8. Multilingual design — how the language requirement is actually satisfied

The failure mode here (see Risk 3 in §9) is a language toggle that only
swaps UI strings. It must be **functional**, not cosmetic:

| Surface | Data used | Effect |
|---|---|---|
| Interface | `users.locale` | Changes UI text |
| Guide selection | `user_preferences.guide_language` | Shows/ranks guides who speak the selected language |
| Package recommendations | `tour_packages.languages_offered` | Filters/ranks packages by language |

- **Storage**: BCP-47 codes only, validated against the `languages` table
  (R6) — never free-text language names.
- **Filtering**: applied **server-side**, filtering both guides and
  packages — this is what makes it a functional preference rather than a
  UI translation layer.
- **Fallback**: if no match exists for the preferred language, show the
  English option **with a clear note** — never silently return an empty
  result set.
- **Hackathon-wide note**: at least one Indian language should appear
  somewhere it's natural to this statement (guide language filtering is the
  most natural fit here) — the data is already multilingual so this is
  largely a filtering exercise, not a translation effort.

---

## 9. Risks & fallbacks (plan for these before you hit them)

| Risk | Cause | Fallback |
|---|---|---|
| **Wrong price after swapping** | Negative `price_delta`s and repeated updates cause incorrect totals or double-counting | Recalculate the total **from scratch** after every change, in `Decimal`. If time is short, reduce the number of swappable components rather than risk incorrect pricing. |
| **Guide not treated like a package component** | Guides live in separate tables, risking a separate pricing/selection code path | Treat the selected guide as a package component so it reuses the same selection + repricing logic. If time is short, use a simple fixed day-rate for guides. |
| **Language setting doesn't actually affect results** | Language option changes only UI, not recommendations | Make language filtering work end-to-end **first** (server-side, filtering guides + packages). Full UI translation can come later. |

---

## 10. 24-hour execution plan

| Time | Focus | Team actions |
|---|---|---|
| 00–04 hrs | Plan & Data Setup | Lock MVP · study data model · set up database · define API structure · finalize UI & ownership |
| 04–08 hrs | Build the Foundation | Curated packages · user preferences/history · package details · customization UI |
| 08–12 hrs | Core Engine | AI package builder · component swapping · live repricing · price breakdown · dynamic itinerary |
| 12–16 hrs | Smart Features | Guide matching (incl. the mandatory availability check) · language filtering · add-ons · travel pace · budget optimization · conflict detection |
| 16–20 hrs | Integrate & Polish | Trip map · live price comparison · save/share · booking · full integration · bug fixing |
| 20–24 hrs | Freeze & Demo | **No new features** · stress test · final demo ×3 · slides · backup flow · deployment |

If behind schedule at any checkpoint, cut from the **stretch** list in §2.1
before cutting anything in the MVP list — the mandatory guide-availability
enhancement is never the thing that gets cut.

---

## 11. Judging rubric & repo-hygiene checklist

| Dimension | What scores well |
|---|---|
| **MVP completeness** | Every "What you need to build" item for PS-04 is present and wired end-to-end in code. |
| **Coverage vs. PS** | Core capability + terminal outcome (customize → guide-check → reprice → book) implemented and reachable from the app entry point. |
| **Data-model conformance** | Canonical tables/columns used as-is; boundary rules enforced in **code** (not just described); additions (`package_selections`) documented. |
| **Structure & hygiene** | Required layout followed; README contract complete, in order; `.env.example` present; sensible commit history. |
| **Runnability** | Clear run steps; app builds; seed/fixtures let the demo path actually run. |

Assessment is strict: unimplemented MVP items, undocumented schema drift, or
an unrunnable repo lower the score, regardless of what the README claims.

**Repo-hygiene self-check — run through this before flagging work as ready
for the human to commit:**
- [ ] File landed in the correct top-level folder per §4's layout — nothing
      stray at repo root.
- [ ] `.env.example` still lists every env var the app actually needs, with
      dummy values, no real secrets.
- [ ] `.gitignore` covers `node_modules/`, `__pycache__/`, `.env`, build
      output, and OS cruft (`.DS_Store`) — check the diff doesn't include
      any of these.
- [ ] No secrets, API keys, or credentials anywhere in the diff — scan
      before proposing a commit message.
- [ ] `data-model/DATA_MODEL.md` is updated if this change touched schema.
- [ ] README.md sections affected by this change are updated (§4.2).
- [ ] Proposed commit message(s) are scoped and conventional
      (`feat:`/`fix:`/`docs:`/`test:`/`chore:`), not a giant "misc changes"
      dump — split into multiple commits if the change touches unrelated
      things.
- [ ] No commit message, trailer, or metadata attributes the change to an
      AI tool (§0) — attribute it to the human who will run the commit.

---

## 12. Coding guardrails — apply these on every change, not just at review time

- **Never** use a float for money, anywhere in the stack. `Decimal` in
  Python, string-serialized over the API, decimal-safe arithmetic in the
  frontend.
- **Never** rename, drop, or repurpose a canonical column or table (R1). New
  requirements get new, additive tables/columns — document them in
  `data-model/DATA_MODEL.md` the same day they're added, not at submission
  time.
- **Never** parse an ID for meaning (R2) — treat `htl_a91f3c` as an opaque
  string, full stop, even though the prefix is human-readable.
- Enforce every boundary rule stated in the PS (guide availability, language
  filtering, price bounds) **in the backend**, with a test — a rule that's
  only enforced in the UI doesn't count, per the hackathon's own scoring
  language.
- Recompute totals from scratch on every package change — no incremental
  price accumulation (§3.1, §9).
- Keep the AI layer advisory: it ranks/explains from real rows; it never
  invents a price or an availability fact (§6.2, §7).
- Version itineraries rather than mutating in place when a package is
  customized (`itineraries.version` / `is_active`).
- Write the guide-availability hard-proof test **early**, not at hour 23 —
  it's the single most-checked piece of behavior in this PS.
- Keep `.env.example` current the moment a new env var is introduced.
- **Never commit or push anything yourself** — see §0. Summarize, propose,
  hand back to the human.

---

## 13. Definition of done for the hackathon submission

- [ ] Package listing + **one** fully customisable package, live.
- [ ] Swapping hotel tier / activity / transfer / guide updates itinerary
      and total price **live**, correctly, using `Decimal`.
- [ ] Guide component reflects language + specialisation + price in the
      total.
- [ ] Language preference visibly changes recommended/displayed
      packages or guides (server-side, not cosmetic).
- [ ] Guide-availability refusal flow demoable end-to-end: clash named →
      same-language/same-specialisation substitute offered → total
      reprices.
- [ ] `data-model/DATA_MODEL.md` documents `package_selections` and any
      other additions.
- [ ] `.env.example` covers every required env var.
- [ ] README follows the 8-section contract, in order, and every claim in
      it is backed by working code.
- [ ] Tests exist for repricing correctness and the guide-availability
      hard-proof scenario; both are runnable with a documented one-liner.
- [ ] App builds and runs from the documented steps, from a clean clone of
      `https://github.com/kognivera-org/kv-hack2026-codeblooded`.
- [ ] Commit history is entirely human-authored, pushed by team members
      themselves — no AI-attributed commits (§0).

## 14. Roadmap beyond the hackathon (production-readiness path)

Once the MVP above is solid, in rough priority order for making this a real,
deployable product rather than a demo:

1. **Auth & accounts** — real user auth (the hackathon `users` table is
   synthetic/pre-seeded; add real signup/login without touching canonical
   columns).
2. **Payments** — replace the booking confirmation stub with a real payment
   provider integration behind the `bookings.idempotency_key` contract
   that's already in the data model.
3. **Supplier integration** — hotels/transfers/guides currently come from
   the seeded dataset; the target architecture's "Travel Partners" layer
   (§6.1) is where live supplier APIs would plug in.
4. **Realtime updates** — move from re-fetch-on-change to the SSE/WebSocket
   live-update layer sketched in §6.1, once the core loop is proven.
5. **Observability & trust/safety** — audit trail, rate limits, structured
   logging on quotes/AI calls/booking status, per the target architecture's
   "Experience + Platform Layer."
6. **Scale-out** — split `backend/`'s internal modules (§6.2) into separate
   services only once there's a concrete reason to (load, team size,
   deploy-cadence mismatch) — not preemptively.

---

## 15. Reference documents already in this repo/handout

- `01_YOUR_DATA_MODEL.md` — full 21-table field reference (this file
  summarizes; that file is authoritative on exact column types/constraints).
- `KogniVEra_PS.txt` — the problem statement verbatim.
- `HACKATHON.md` — repo structure, README contract, and judging rubric
  verbatim.
- `data/WORKING_WITH_THE_DATA.md` — loading instructions, incl. reading
  money without corrupting it. **Read before writing queries.**
- `data/enums.json` — legal enum values; validate against this, don't
  hardcode a second copy.
- `data/queries/starter_queries.sql` — 6 working queries against
  `data/PS-04.db`, each commented.
- `tools/validate_conformance.py` — run early and before submission.
- `02_DATA_MODEL_DIAGRAM.html` — clickable ER-style diagram (download and
  open locally; SharePoint won't render it inline).
- Pitch deck (`PackagePro_24-Hour_Pitch_Deck_*.pdf`) — source for the
  architecture/flow diagrams and tech-stack rationale summarized in §6–§7.

---

## 16. Quick reference

- **Repo:** https://github.com/kognivera-org/kv-hack2026-codeblooded
- **Team:** Divyansh Duggad (Lead, Backend & AI) · Navya Agrawal (Design) ·
  Priyanka Rajput (Frontend & UI) · Priyanshi Singh (Pitch Lead)
- **Agent git policy:** read-only git commands only; never commit, push, or
  attribute changes to an AI (§0).
