import type { Bullet, WeaponId } from '../engine/types'

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

export function fireWeapon(
  id: WeaponId,
  x: number,
  y: number,
  dir: 1 | -1,
  ducking: boolean,
): Bullet[] {
  const aimY = ducking ? 0.25 : 0
  const out: Bullet[] = []
  const push = (b: Omit<Bullet, 'fromPlayer'>) => out.push({ ...b, fromPlayer: true })

  if (id === 'pulse') {
    push({
      x, y, vx: dir * 920, vy: aimY * 120, life: 0.9, damage: 12, radius: 4,
      weapon: id, color: WEAPONS.pulse.color,
    })
  } else if (id === 'hyperspread') {
    for (let i = -3; i <= 3; i++) {
      push({
        x, y,
        vx: dir * (780 - Math.abs(i) * 30),
        vy: i * 140 + aimY * 80,
        life: 0.75, damage: 8, radius: 3.5,
        weapon: id, color: WEAPONS.hyperspread.color,
      })
    }
  } else if (id === 'plasma') {
    push({
      x, y, vx: dir * 1100, vy: aimY * 40, life: 1.1, damage: 18, radius: 5,
      weapon: id, pierce: 4, color: WEAPONS.plasma.color,
    })
  } else if (id === 'inferno') {
    for (let i = 0; i < 3; i++) {
      push({
        x: x + dir * 10, y: y + (i - 1) * 6,
        vx: dir * rand(420, 560), vy: rand(-60, 60),
        life: 0.28, damage: 6, radius: 10,
        weapon: id, flame: true, color: WEAPONS.inferno.color,
      })
    }
  } else if (id === 'swarm') {
    for (let i = 0; i < 3; i++) {
      push({
        x, y: y - 6 + i * 6,
        vx: dir * rand(360, 480), vy: rand(-200, 200),
        life: 1.6, damage: 16, radius: 5,
        weapon: id, homing: true, color: WEAPONS.swarm.color,
      })
    }
  } else if (id === 'railstorm') {
    push({
      x, y, vx: dir * 1400, vy: 0, life: 0.8, damage: 34, radius: 6,
      weapon: id, pierce: 6, color: WEAPONS.railstorm.color,
    })
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue
      push({
        x, y, vx: dir * 900, vy: i * 180, life: 0.5, damage: 10, radius: 3,
        weapon: id, color: '#e0d0ff',
      })
    }
  }

  return out
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a)
}

export const DROP_TABLE: WeaponId[] = [
  'hyperspread', 'plasma', 'inferno', 'swarm', 'railstorm',
]
