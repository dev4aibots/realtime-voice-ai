# DESIGN.md — realtime-voice-ai demo (Spotify-exact)

**Target:** `dev4aibots/realtime-voice-ai` public demo — a simulated low-latency
voice-AI pipeline (VAD → turn-taking state machine → LLM → TTS) with a streaming
session-events view. The UI builder codes FROM this file. No credentials anywhere.

**Design thesis:** Spotify's "Now Playing / live session" product language —
near-black immersive surfaces, a SINGLE vibrant green accent used scarcely
(play/pause, active states, primary CTAs — never decorative, never background),
pill-and-circle controls, Inter typography standing in for the proprietary
SpotifyMix/Circular, mono numerals for all latency/timing readouts.

**Style prompt (superdesigndev/superdesign-prompts, MIT):**
slug `electric-dark-usage-based-pricing-calculator-20e556`
(prompts/electric-dark-usage-based-pricing-calculator-20e556/README.md) —
electric dark dev-tool aesthetic, near-black ink, single high-energy accent
discipline, mono numerals, hairline borders, large radii. We keep its structure
and motion discipline and re-theme its lime accent to Spotify functional green
`--accent-functional` (#1ED760) and its iris washes to green washes.

**Wow anchor (DavidHDev/react-bits, MIT + Commons Clause — fine for portfolio
demo, flag before SaaS resale):** `Aurora` **TS-TW only** — one hero anchor per
page (playbook rule), installed with:
`npx shadcn@latest add @react-bits/Aurora-TS-TW`
Rendered behind the "Live session" hero with green-tinted colorStops
(`#1ED760`, `#1DB954`, `#191414`), amplitude ~1.0–1.2, speed ~0.5, at ≤12%
opacity over `--bg-canvas` so the dark immersion holds. Reference-motion only
(no-license repo): igorm84/spotify-astro-transitions — study view-transition
patterns, never copy code. Reference-only tokens: tayfunerbilen/
react-tailwind-spotify-clone `tailwind.config.js` (no LICENSE file).

---

## Core Rule

**You are a CSS expert. Never use raw values (hex, px, etc.) in component code.
Only use the semantic tokens below.** Every hex in this file is documented with
its source under "Token provenance". If a token name is missing, suffix it
with `/* check-token */` and stop.

---

## 1. Color tokens (CSS custom properties)

All values live on `:root`. Dark-only product — there is no light theme
(Spotify's web product is dark-first by design).

| Token | Value | Role | Provenance |
|---|---|---|---|
| `--bg-canvas` | `#121212` | App canvas, deepest background | shadcn.io/design/spotify; ipalettes Spotify palette; brand-guidelines.md (GitHub) |
| `--bg-card` | `#181818` | Cards step up from canvas | shadcn.io/design/spotify; brand-guidelines.md |
| `--bg-interactive` | `#1f1f1f` | Interactive surfaces (hover targets, inputs) | shadcn.io/design/spotify |
| `--bg-elevated` | `#282828` | Elevated surfaces, popovers, player bars | brand-guidelines.md; tayfunerbilen tailwind.config.js (`active`) |
| `--bg-brand-black` | `#191414` | Brand black (hero accents, footer) | official Spotify brand guidelines (#191414) |
| `--bg-pure` | `#000000` | True black (OLED, overlays) | official Spotify brand guidelines |
| `--accent-brand` | `#1DB954` | Brand green — logo moments, brand lockups only | official Spotify brand guidelines (primary brand color) |
| `--accent-functional` | `#1ED760` | THE functional green — play/pause, active nav, primary CTAs, live indicators. Used scarcely. | shadcn.io/design/spotify ("functional green used scarcely"); official brand docs (#1ED760 lighter green) |
| `--accent-hover` | `#1FDF64` | Brighter green for hover states of green buttons | ipalettes Spotify palette (#1FDF64 in official set) |
| `--accent-on` | `#000000` | Text/icon on green fills | contrast necessity (Spotify black glyph on green) |
| `--fg-primary` | `#FFFFFF` | Primary text on dark | brand guidelines |
| `--fg-secondary` | `#B3B3B3` | Secondary text, metadata | brand-guidelines.md; tayfunerbilen config (`link`) |
| `--fg-tertiary` | `#A7A7A7` | Tertiary text | brand-guidelines.md |
| `--fg-muted` | `#6A6A6A` | Muted text, placeholders | brand-guidelines.md |
| `--fg-disabled` | `#535353` | Disabled text | brand-guidelines.md |
| `--border-hairline` | `#404040` | Borders, dividers | brand-guidelines.md |
| `--surface-variant` | `#1A1A1A` | Alt surface | brand-guidelines.md |
| `--light-pill` | `#EEEEEE` | Rare light-pill CTA fill (marketing/consent only) | shadcn.io/design/spotify |
| `--light-pill-fg` | `#181818` | Text on the light pill | shadcn.io/design/spotify |
| `--aurora-wash` | `rgba(30,215,96,0.10)` | Green glow wash for hero/accents | derived from `--accent-functional` (10%) |

### Token provenance (sources of every hex)
1. **Official Spotify brand guidelines** (documented in GitHub
   `twinpeakstownie/reachy_ultradancemix_9000/.../spotify-branding-guidelines.md`
   + designyourway.net logo analysis): `#1DB954` (brand green),
   `#1ED760` (light green, logo), `#191414` (black), `#000000`,
   grays `#282828 #181818 #121212 #1A1A1A #535353 #404040 #B3B3B3 #A7A7A7 #6A6A6A`.
2. **shadcn.io/design/spotify** (Spotify design-system reference): functional
   green `#1ed760` used scarcely (play/pause, active nav, CTAs — never
   decorative/background); charcoals `#121212 #181818 #1f1f1f`; light pill
   `#eeeeee`/`#181818`; Inter as the open-source Circular substitute;
   1.4–2px letter-spacing on uppercase button labels; pill-and-circle button
   shapes.
3. **tayfunerbilen/react-tailwind-spotify-clone** `tailwind.config.js`
   (reference-only, no license — do not copy code): `backdrop #121212`,
   `primary #1db954`, `active #282828`, `link #b3b3b3`, `footer #181818`,
   `box-shadow spotify: 0 2px 4px 0 rgb(0 0 0 / 20%)`.
4. **ipalettes.com Spotify palette**: `#1DB954 #191414 #1ED760 #121212
   #1FDF64` — confirms `#1FDF64` as the brighter hover green.

### Logic Matrix: Color Pairings

| Background Token | Foreground Token | Notes |
|---|---|---|
| `--bg-canvas` | `--fg-primary` / `--fg-secondary` | Standard pairing |
| `--bg-card` | `--fg-primary` | Card content |
| `--bg-interactive` | `--fg-primary` | Hover of cards/list rows |
| `--bg-elevated` | `--fg-primary` | Player bar, menus — MUST pair |
| `--accent-functional` | `--accent-on` | Green fill → black glyph, MUST pair |
| `--bg-brand-black` | `--fg-primary` | Hero/footer brand zones |
| `--light-pill` | `--light-pill-fg` | Rare marketing CTA, MUST pair |

**Contrast requirements:** normal text ≥ 4.5:1 (WCAG AA); large text / UI
icons ≥ 3:1. `--fg-muted` on `--bg-canvas` is decorative-only, never body text.

---

## 2. Typography

**Stack** (Inter is the closest open-source substitute for SpotifyMixUI /
Circular — proprietary, licensed only to Spotify):
```css
--font-ui: "Inter", "Helvetica Neue", Helvetica, Arial, "Hiragino Sans",
  "Hiragino Kaku Gothic ProN", Meiryo, "MS Gothic", sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
```
Load via Google Fonts (or `next/font`): Inter 400/500/600/700/800, JetBrains
Mono 400/500/600. Spotify buttons use uppercase labels with tight
`letter-spacing: 1.4–2px` to preserve the systematic label voice.

**Type scale** (shorthand tokens — MUST use `font: var(...)`, never raw sizes):

| Token | Spec | Role |
|---|---|---|
| `--text-display` | 700 48px/1.05, tracking −0.02em | Hero headline ("Live voice session") |
| `--text-title` | 700 28px/1.15, tracking −0.01em | Section titles |
| `--text-h3` | 700 20px/1.3 | Card titles, pipeline stage names |
| `--text-body` | 400 15px/1.55 | Body copy |
| `--text-body-strong` | 600 15px/1.55 | Emphasis |
| `--text-caption` | 500 13px/1.4, `--fg-secondary` | Metadata, timestamps |
| `--text-eyebrow` | 700 11px, uppercase, tracking 0.14em, `--fg-secondary` | Section eyebrows (electric-dark style) |
| `--text-button` | 700 14px, uppercase, tracking 1.4px | CTA labels (Spotify label voice) |
| `--text-mono-xl` | 600 34px `--font-mono`, tabular-nums | Latency readouts |
| `--text-mono` | 500 13px `--font-mono`, tabular-nums | Timings, event IDs, dbFS levels |
| `--text-mono-micro` | 400 11px `--font-mono`, tracking 0.1em | Technical micro-labels |

**Keyword rules:** NEVER use individual `font-size`/`line-height` if a shorthand
exists · SHOULD downgrade one level on mobile (display → title) · ALWAYS
`tabular-nums` for live counters to prevent layout shift.

---

## 3. Spacing (8-pt grid, 4px base unit)

```css
--space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
--space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
--space-12: 48px; --space-16: 64px;
--section-gap: 64px;            /* between page sections */
--container-max: 1200px;        /* centered page container */
--stack-gap: var(--space-4);    /* default card/list gap */
--control-pad-x: 32px;          /* CTA pill horizontal padding */
--control-pad-y: 14px;          /* CTA pill vertical padding */
```
**Rules:** MUST use control tokens for interactive padding; SHOULD use
`--stack-gap` as the default layout rhythm; NEVER invent one-off pixel values.

---

## 4. Shape (pill-and-circle discipline)

Spotify builds every button as a pill or circle. Radii below follow the Spotify
web-player product surface (convention observed on the live product — not from
an official doc; flagged for the builder's awareness).

| Token | Value | Use |
|---|---|---|
| `--radius-pill` | `9999px` | All CTAs and buttons (green + outline + light pill) |
| `--radius-circle` | `50%` | Play/pause transport, avatar, mic button |
| `--radius-card` | `8px` | Cards, pipeline stage tiles, event rows |
| `--radius-panel` | `16px` | Large hero panel, session console |
| `--radius-sm` | `4px` | Chips, badges, mono tags |

---

## 5. Shadows & elevation

From the clone's Spotify token (reference): `--shadow-spotify:
0 2px 4px 0 rgb(0 0 0 / 20%)` for cards on dark. Layered elevations:
```css
--shadow-card: 0 2px 4px 0 rgb(0 0 0 / 20%);
--shadow-panel: 0 8px 24px 0 rgb(0 0 0 / 40%);
--shadow-float: 0 16px 48px 0 rgb(0 0 0 / 60%);   /* menus, dialogs */
--shadow-green-glow: 0 0 60px -12px rgba(30,215,96,0.45); /* active CTA */
```
**Z-index** (MUST use tokens): `--z-bg: -1` (aurora) · `--z-base: 0` ·
`--z-sticky: 10` · `--z-overlay: 50` (transport bar) · `--z-modal: 100`.
NEVER use raw z-index; pair z with the matching shadow level.

---

## 6. Motion rules (primer-style enforcement)

```css
--motion-duration-micro: 100ms;   /* hover/focus micro-interactions */
--motion-duration-short: 200ms;   /* state changes */
--motion-duration-medium: 300ms;  /* UI animation ceiling */
--motion-duration-long: 500ms;    /* hard ceiling, entrances only */
--motion-easing-hover: cubic-bezier(0.4, 0, 0.2, 1);
--motion-easing-enter: cubic-bezier(0.22, 0.61, 0.36, 1);
--motion-easing-linear: linear;
--motion-transition-hover: 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

| Keyword | Rule |
|---|---|
| MUST | Use `motion.transition.*` tokens for interactive state changes |
| MUST | Respect `prefers-reduced-motion` — aurora and waveform freeze to a static frame |
| MUST | Keep UI animations ≤ `motion.duration.medium` |
| NEVER | Exceed `motion.duration.long` for UI interactions |
| NEVER | Loop motion indefinitely without user control (aurora is ambient: ≤ 12% opacity, slow) |
| NEVER | Convey session state by motion alone — always pair with color + label |

**Decision tree:** entering viewport → `enter`; moving/morphing → easing `enter`;
hover → `hover`; constant (waveform, pulsing live-dot) → `linear`.

Live-session motion: green "live" dot pulses at 1.6s linear (opacity 0.5↔1);
waveform bars animate on simulated audio level; event rows fade-slide in
200ms on arrival. All decorative motion halts under `prefers-reduced-motion`.

---

## 7. Golden example — the green play/CTA button (all 5 states)

```css
.btn-primary {
  background-color: var(--accent-functional);
  color: var(--accent-on);
  border: none;
  border-radius: var(--radius-pill);
  padding-block: var(--control-pad-y);
  padding-inline: var(--control-pad-x);
  font: var(--text-button);
  cursor: pointer;
  transition: background-color var(--motion-transition-hover),
              box-shadow var(--motion-transition-hover),
              transform var(--motion-transition-hover);
}
.btn-primary:hover {
  background-color: var(--accent-hover);
  box-shadow: var(--shadow-green-glow);
}
.btn-primary:focus-visible {
  outline: 2px solid var(--fg-primary);
  outline-offset: 3px;
}
.btn-primary:active {
  background-color: var(--accent-brand);
  transform: scale(0.97);
}
.btn-primary:disabled {
  background-color: var(--fg-disabled);
  color: var(--bg-canvas);
  cursor: not-allowed;
  opacity: 1; /* NEVER use opacity for disabled */
}
@media (prefers-reduced-motion: reduce) { .btn-primary { transition: none; } }
```

### Interactive states checklist (all interactive elements MUST define)
Rest · `:hover` · `:focus-visible` (NEVER `:focus` alone) · `:active` ·
`:disabled` / `[aria-disabled]`.

---

## 8. Component inventory (what the UI builder constructs)

All hand-built **shadcn-style** components (`components/ui/`, owned source,
themed with these tokens — do NOT ship shadcn defaults un-themed):

1. **Session hero** — full-width panel (`--bg-brand-black` → `--bg-canvas`
   gradient, Aurora hero anchor behind at ≤12% opacity). Eyebrow: "LIVE VOICE
   SESSION" + pulsing green dot. Display headline + subhead. Primary green pill
   "Start session" / "End session". Live latency readout in `--text-mono-xl`
   (e.g. `212ms` end-to-end).
2. **Transport bar** (Spotify Now Playing idiom) — sticky bottom bar,
   `--bg-elevated`, circular play/pause in green, mute/volume slider, session
   timer in mono. This is the voice-AI analogue of the Spotify player bar.
3. **Pipeline stage cards** — 4 tiles: VAD · Turn-taking · LLM · TTS
   (`--bg-card`, `--radius-card`). Active stage gets green left-edge + green
   stage name; idle stages `--fg-secondary`. Each shows last-stage latency in
   `--text-mono`.
4. **Streaming event timeline** — vertical feed of session events
   (`session.start`, `vad.speech_start`, `turn.yield`, `llm.token`,
   `tts.audio_chunk`, `session.end`); rows fade-slide in 200ms; event names in
   `--text-mono-micro`, payloads in `--text-mono`; green tint on live row.
5. **Metrics strip** — 3-up glass cards: end-to-end latency, TTS time-to-first-
   byte, interruption rate. Big mono numbers, eyebrow labels, green delta chips.
6. **Waveform / VAD visualizer** — canvas bars driven by the simulated audio
   level; green bars on dark; freezes under reduced motion. (Custom code — no
   license-encumbered viz library needed.)
7. **Config panel** (shadcn-style accordion/sliders) — simulated knobs: VAD
   threshold, turn-taking pause ms, LLM stream chunk, voice select. Sliders
   styled per electric-dark: 6px track `--bg-elevated`, green fill,
   22px green thumb.
8. **Transcript console** — user/assistant turns; assistant streaming text with
   caret; green left border on active turn.

Layout: single scrolling page, `--container-max: 1200px`, hero → metrics →
pipeline → timeline/console → config → footer. Cards reflow 4→2→1, timeline
collapses gracefully on mobile.

---

## 9. Hallucination guard

> If you suggest a token name not found in this spec, suffix it with
> `/* check-token */`. Every hex must trace to a row in §1; every component to
> §8. Do not invent a "light mode", a second accent color, or non-Spotify
> green `#00FF00`-style neons — the ONLY greens are `#1DB954 #1ED760 #1FDF64`.

---

## Appendix: wiring cheat-sheet (builder)

1. `npx shadcn@latest init` → `npx shadcn@latest add button card slider accordion badge dialog` → theme `components/ui/*` with §1 tokens; never ship shadcn defaults un-themed.
2. Hero anchor: `npx shadcn@latest add @react-bits/Aurora-TS-TW` (TS-TW only, ONE hero anchor) — green colorStops, ≤12% opacity, frozen frame under `prefers-reduced-motion`.
3. Style prompt: paste `superdesigndev/superdesign-prompts` slug `electric-dark-usage-based-pricing-calculator-20e556` README design-spec into the build agent; swap lime→`--accent-functional`, iris washes→green washes.
4. Build §8 inventory from tokens only; mono numerals for every latency/timing; `:focus-visible` everywhere; reduced-motion honored.
5. No credentials, no copied code from no-license repos (igorm84/spotify-astro-transitions = motion patterns reference only; tayfunerbilen clone = token reference only); react-bits is MIT+Commons Clause — fine for this portfolio demo.
