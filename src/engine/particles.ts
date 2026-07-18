import type { Particle } from './types'
import { rand } from './types'

export class Particles {
  list: Particle[] = []

  burst(x: number, y: number, color: string, n = 12, speed = 220, glow = true) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = rand(speed * 0.3, speed)
      this.list.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - rand(40, 120),
        life: rand(0.25, 0.7),
        max: 0.7,
        size: rand(2, 5),
        color,
        glow,
      })
    }
  }

  flame(x: number, y: number, dir: number) {
    for (let i = 0; i < 6; i++) {
      this.list.push({
        x: x + rand(-4, 4),
        y: y + rand(-6, 6),
        vx: dir * rand(180, 340),
        vy: rand(-80, 40),
        life: rand(0.15, 0.35),
        max: 0.35,
        size: rand(6, 14),
        color: Math.random() > 0.5 ? '#ff9a3d' : '#ff3d5a',
        glow: true,
      })
    }
  }

  update(dt: number) {
    const next: Particle[] = []
    for (const p of this.list) {
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 420 * dt
      if (p.life > 0) next.push(p)
    }
    this.list = next
  }

  draw(ctx: CanvasRenderingContext2D, camX: number) {
    for (const p of this.list) {
      const a = Math.max(0, p.life / p.max)
      ctx.globalAlpha = a
      if (p.glow) {
        ctx.shadowBlur = 16
        ctx.shadowColor = p.color
      }
      ctx.fillStyle = p.color
      ctx.fillRect(p.x - camX - p.size / 2, p.y - p.size / 2, p.size, p.size)
      ctx.shadowBlur = 0
    }
    ctx.globalAlpha = 1
  }
}
