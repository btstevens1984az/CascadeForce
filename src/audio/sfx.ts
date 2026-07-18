/** Tiny original WebAudio cues — no ripped samples. */
export class Sfx {
  private ctx: AudioContext | null = null

  private ac() {
    if (!this.ctx) this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private beep(freq: number, dur: number, type: OscillatorType, gain = 0.04) {
    const ctx = this.ac()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.value = gain
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + dur)
  }

  shoot(kind: string) {
    if (kind === 'inferno') this.beep(180, 0.08, 'sawtooth', 0.03)
    else if (kind === 'swarm') this.beep(520, 0.1, 'square', 0.03)
    else if (kind === 'plasma') this.beep(980, 0.09, 'sine', 0.035)
    else if (kind === 'hyperspread') {
      this.beep(640, 0.05, 'square', 0.025)
      this.beep(880, 0.05, 'square', 0.02)
    } else this.beep(760, 0.05, 'square', 0.025)
  }

  pickup() {
    ;[660, 880, 1100].forEach((f, i) => setTimeout(() => this.beep(f, 0.08, 'triangle', 0.04), i * 50))
  }

  hurt() { this.beep(140, 0.18, 'sawtooth', 0.05) }
  boom() {
    this.beep(90, 0.25, 'sawtooth', 0.06)
    this.beep(60, 0.3, 'square', 0.04)
  }
  jump() { this.beep(420, 0.07, 'triangle', 0.03) }
  win() { ;[523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.beep(f, 0.15, 'triangle', 0.04), i * 90)) }
}
