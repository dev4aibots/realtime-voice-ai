# realtime-voice-ai · demo

A pretend voice assistant that runs a whole conversation turn right in your
browser. Press **Start session**: it listens to you, thinks out loud, and
answers in about 200 milliseconds. Every number on screen comes straight
from the simulated engine — no microphone, no network calls, no models.

## What it shows

- **Waveform stage** — live audio visualization driven by engine frames
- **Pick a session** — snap rail: a clean call, a barge-in (you interrupt
  mid-answer), or your own custom mix
- **Answer speed** — the engine's real timings: you stop talking, it starts
  thinking, it starts answering, and the total answer speed
- **Pipeline** — the five real states (IDLE → LISTENING → WAITING →
  THINKING → SPEAKING) as a stepper rail
- **Event stream** — every engine frame, as it happens
- **Transcript** — a lyric sheet: the current line in full white with a
  word-by-word reveal, past lines dimmed
- **Tune the session** — your script, a weather-tool toggle, and an
  interrupt-time slider wired to the engine's real interruption anchor

## Design

Spotify-exact dark product language: near-black surfaces, one green accent
(`#1DB954`), pill-and-circle controls, mono numerals for every timing.
Type: Sora (display) + Instrument Sans (body) + JetBrains Mono (numerals).
See [DESIGN.md](../DESIGN.md) for the token contract (also mirrored as
`demo/DESIGN.md` in the repo).

## Run it

```bash
npm install
npm run dev      # local dev
npm run build    # production build (tsc + vite)
npm run lint     # oxlint
```

Design gates (all must exit 0):

```bash
# run on a staging copy of src + index.html + public (excludes node_modules/dist)
anti-slop-check.sh <staging-copy>
npx stylelint "src/**/*.css"
npx tailwind-a11y 'src/**/*.{tsx,jsx}'
```
