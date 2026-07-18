# Cascade Force

Cinematic **2.5D WebGL** run-and-gun — Three.js lighting, bloom, shadows, and steroid-tier weapon drops.

Inspired by classic genre DNA. **Not affiliated with Konami or Contra.** See [DISCLAIMER.md](./DISCLAIMER.md).

## Play

```bash
npm install
npm run dev
```

Open **http://localhost:5174**.

---

## Live gameplay

Real captures from the running WebGL build — each clip is a **5-second loop** (GIF for the README; MP4 also in [`media/`](./media/)).

### Title

<p align="center">
  <img src="media/01-title.gif" alt="Cascade Force title screen" width="720" />
</p>

### Pulse rifle combat

<p align="center">
  <img src="media/02-live-combat.gif" alt="Live pulse rifle combat in Jungle Teeth" width="720" />
</p>

### Hyper Spread

<p align="center">
  <img src="media/03-hyper-spread.gif" alt="Hyper Spread shredding enemy ranks" width="720" />
</p>

### Duck under fire

<p align="center">
  <img src="media/04-duck-dodge.gif" alt="Ducking under chest-height enemy shots" width="720" />
</p>

### Aim skyward

<p align="center">
  <img src="media/05-aim-skyward.gif" alt="Aiming up with Plasma Lance at flyers" width="720" />
</p>

### Mid-boss clash

<p align="center">
  <img src="media/06-midboss-clash.gif" alt="Railstorm vs Canopy Stalker mid-boss" width="720" />
</p>

### Inferno Thrower

<p align="center">
  <img src="media/07-inferno-push.gif" alt="Inferno Thrower push through Baseline Siege" width="720" />
</p>

MP4 versions (same 5s loops):  
[title](media/01-title.mp4) · [combat](media/02-live-combat.mp4) · [spread](media/03-hyper-spread.mp4) · [duck](media/04-duck-dodge.mp4) · [aim up](media/05-aim-skyward.mp4) · [mid-boss](media/06-midboss-clash.mp4) · [inferno](media/07-inferno-push.mp4)

Re-capture locally (dev server on :5174 + ffmpeg + Playwright):

```bash
npm run dev
npm run capture
```

---

## What's in v2

- Rebuilt on **Three.js** (WebGL) with ACES tone mapping, soft shadows, and Unreal bloom
- **Aim up** with `W` / `↑` (hold + move for diagonals)
- **Duck** with `S` / `↓` to shrink your hitbox and let chest-height shots sail over you
- Jump is **Space / K** so aim and jump never fight each other

## Campaign

| Op | Theater | Mid-boss | Main boss |
|----|---------|----------|-----------|
| 1 | Jungle Teeth | Canopy Stalker | Rootbreaker MK-I |
| 2 | Baseline Siege | Rail Crusher | Fortress Core |
| 3 | Red Cascade | Void Sentinel | **Cascade Overlord** |

## Arsenal

Pulse Rifle · Hyper Spread · Plasma Lance · Inferno Thrower · Swarm Missiles · Railstorm

## Controls

| Input | Action |
|-------|--------|
| A / D | Move |
| W / ↑ | Aim up |
| A/D + W | Aim diagonal |
| Space / K | Jump |
| S / ↓ | Duck (dodge high fire) · aim down in air |
| J / Z | Fire |
| Enter | Start / Continue |

## Stack

Vite · TypeScript · Three.js · EffectComposer bloom

## License

MIT — see [LICENSE](./LICENSE).
