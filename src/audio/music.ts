/**
 * Original combat BGM — industrial / groove-metal inspired.
 * Not Pantera, not any commercial track. Procedural WebAudio only.
 */
export class Music {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private timer: number | null = null
  private step = 0
  playing = false
  muted = false

  private ac() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.12
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  start() {
    if (this.playing) {
      void this.ac().resume()
      return
    }
    this.playing = true
    this.ac()
    this.step = 0
    this.schedule()
  }

  stop() {
    this.playing = false
    if (this.timer != null) {
      window.clearTimeout(this.timer)
      this.timer = null
    }
  }

  setMuted(m: boolean) {
    this.muted = m
    if (this.master) this.master.gain.value = m ? 0 : 0.12
  }

  toggleMute() {
    this.setMuted(!this.muted)
    return this.muted
  }

  /** ~100 BPM — 16th notes */
  private schedule() {
    if (!this.playing || !this.ctx || !this.master) return
    const ctx = this.ctx
    const t0 = ctx.currentTime + 0.02
    const beat = 60 / 100
    const sixteenth = beat / 4

    // 2 bars = 32 sixteenths
    for (let i = 0; i < 32; i++) {
      const t = t0 + i * sixteenth
      const s = (this.step + i) % 32

      // Kick on 1 & 3, plus groove pickup
      if (s % 8 === 0 || s === 10 || s === 26) this.kick(t)
      // Snare on 2 & 4
      if (s % 16 === 8) this.snare(t)
      // Hats
      if (s % 2 === 0) this.hat(t, s % 4 === 0 ? 0.03 : 0.015)

      // Guitar chugs — original syncopated pattern (not Walk)
      const chug = [0, 1, 2, 4, 6, 8, 9, 12, 14, 16, 17, 18, 20, 22, 24, 25, 28, 30]
      if (chug.includes(s)) {
        const open = s % 8 === 0 || s === 16
        this.guitar(t, open ? 73.42 : 82.41, open ? 0.18 : 0.09) // D2 / E2-ish power
      }
      // Higher answer riff bars 2
      if (s === 20 || s === 22 || s === 28 || s === 30) {
        this.guitar(t, 110, 0.1)
      }
      // Occasional octave stab
      if (s === 0 || s === 16) this.guitar(t, 146.83, 0.22)
    }

    this.step = (this.step + 32) % 64
    this.timer = window.setTimeout(() => this.schedule(), beat * 8 * 1000 - 40)
  }

  private kick(t: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(140, t)
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12)
    g.gain.setValueAtTime(0.55, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    o.connect(g)
    g.connect(this.master!)
    o.start(t)
    o.stop(t + 0.2)
  }

  private snare(t: number) {
    const ctx = this.ctx!
    const bufferSize = 2 * ctx.sampleRate * 0.08
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1800
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.28, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
    noise.connect(filter)
    filter.connect(g)
    g.connect(this.master!)
    noise.start(t)
    noise.stop(t + 0.12)

    const o = ctx.createOscillator()
    const og = ctx.createGain()
    o.type = 'triangle'
    o.frequency.value = 180
    og.gain.setValueAtTime(0.15, t)
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
    o.connect(og)
    og.connect(this.master!)
    o.start(t)
    o.stop(t + 0.1)
  }

  private hat(t: number, gain: number) {
    const ctx = this.ctx!
    const bufferSize = ctx.sampleRate * 0.04
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 7000
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
    noise.connect(filter)
    filter.connect(g)
    g.connect(this.master!)
    noise.start(t)
    noise.stop(t + 0.05)
  }

  private guitar(t: number, freq: number, dur: number) {
    const ctx = this.ctx!
    const o1 = ctx.createOscillator()
    const o2 = ctx.createOscillator()
    const g = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1200
    filter.Q.value = 1.2
    o1.type = 'sawtooth'
    o2.type = 'sawtooth'
    o1.frequency.value = freq
    o2.frequency.value = freq * 1.5 // power-chord fifth
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o1.connect(filter)
    o2.connect(filter)
    filter.connect(g)
    g.connect(this.master!)
    o1.start(t)
    o2.start(t)
    o1.stop(t + dur + 0.02)
    o2.stop(t + dur + 0.02)
  }
}
