import type { Bullet, WeaponId } from '../engine/types'
import { rand } from '../engine/types'

export type WeaponDef = {
  id: WeaponId
  name: string
  color: string
  cooldown: number
  description: string
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  pulse: {
    id: 'pulse',
    name: 'PULSE RIFLE',
    color: '#9dffc2',
    cooldown: 0.12,
    description: 'Reliable issue carbine.',
  },
  hyperspread: {
    id: 'hyperspread',
    name: 'HYPER SPREAD',
    color: '#ffd36a',
    cooldown: 0.16,
    description: 'Seven-way shredder. Contra spread on steroids.',
  },
  plasma: {
    id: 'plasma',
    name: 'PLASMA LANCE',
    color: '#39e6ff',
    cooldown: 0.08,
    description: 'Piercing beam that melts ranks.',
  },
  inferno: {
    id: 'inferno',
    name: 'INFERNO THROWER',
    color: '#ff7a3d',
    cooldown: 0.04,
    description: 'Close-range napalm river.',
  },
  swarm: {
    id: 'swarm',
    name: 'SWARM MISSILES',
    color: '#ff5ad5',
    cooldown: 0.28,
    description: 'Homing micro-warheads.',
  },
  railstorm: {
    id: 'railstorm',
    name: 'RAILSTORM',
    color: '#b48cff',
    cooldown: 0.35,
    description: 'Charged slug + lightning shards.',
  },
}

/** Speeds are in world-units/sec (character ~1.7 tall). */
export function fireWeapon(
  id: WeaponId,
  x: number,
  y: number,
  ax: number,
  ay: number,
): Bullet[] {
  const len = Math.hypot(ax, ay) || 1
  const ux = ax / len
  const uy = ay / len
  const px = -uy
  const py = ux
  const out: Bullet[] = []
  const push = (b: Omit<Bullet, 'fromPlayer'>) => out.push({ ...b, fromPlayer: true })

  if (id === 'pulse') {
    push({
      x, y, vx: ux * 26, vy: uy * 26, life: 1.2, damage: 14, radius: 0.28,
      weapon: id, color: WEAPONS.pulse.color,
    })
  } else if (id === 'hyperspread') {
    for (let i = -3; i <= 3; i++) {
      const s = 0.22 * i
      const dx = ux + px * s
      const dy = uy + py * s
      const d = Math.hypot(dx, dy) || 1
      push({
        x, y, vx: (dx / d) * 22, vy: (dy / d) * 22,
        life: 1.0, damage: 9, radius: 0.24,
        weapon: id, color: WEAPONS.hyperspread.color,
      })
    }
  } else if (id === 'plasma') {
    push({
      x, y, vx: ux * 32, vy: uy * 32, life: 1.3, damage: 20, radius: 0.3,
      weapon: id, pierce: 4, color: WEAPONS.plasma.color,
    })
  } else if (id === 'inferno') {
    for (let i = 0; i < 4; i++) {
      const s = rand(-0.25, 0.25)
      const dx = ux + px * s
      const dy = uy + py * s
      const d = Math.hypot(dx, dy) || 1
      const spd = rand(12, 18)
      push({
        x: x + ux * 0.4, y: y + uy * 0.4,
        vx: (dx / d) * spd, vy: (dy / d) * spd,
        life: 0.45, damage: 7, radius: 0.42,
        weapon: id, flame: true, color: WEAPONS.inferno.color,
      })
    }
  } else if (id === 'swarm') {
    for (let i = 0; i < 3; i++) {
      const s = (i - 1) * 0.35
      push({
        x, y: y + s * 0.2,
        vx: ux * rand(10, 14) + px * s * 3,
        vy: uy * rand(10, 14) + py * s * 3,
        life: 2.0, damage: 18, radius: 0.28,
        weapon: id, homing: true, color: WEAPONS.swarm.color,
      })
    }
  } else if (id === 'railstorm') {
    push({
      x, y, vx: ux * 40, vy: uy * 40, life: 1.0, damage: 38, radius: 0.32,
      weapon: id, pierce: 6, color: WEAPONS.railstorm.color,
    })
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue
      const s = 0.28 * i
      const dx = ux + px * s
      const dy = uy + py * s
      const d = Math.hypot(dx, dy) || 1
      push({
        x, y, vx: (dx / d) * 28, vy: (dy / d) * 28,
        life: 0.7, damage: 12, radius: 0.2,
        weapon: id, color: '#e0d0ff',
      })
    }
  }

  return out
}

export const DROP_TABLE: WeaponId[] = [
  'hyperspread', 'plasma', 'inferno', 'swarm', 'railstorm',
]
