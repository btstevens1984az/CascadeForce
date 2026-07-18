export type Vec = { x: number; y: number }

export type WeaponId =
  | 'pulse'
  | 'hyperspread'
  | 'plasma'
  | 'inferno'
  | 'swarm'
  | 'railstorm'

export type Bullet = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  damage: number
  radius: number
  fromPlayer: boolean
  weapon: WeaponId
  pierce?: number
  homing?: boolean
  flame?: boolean
  color: string
}

export type Pickup = {
  x: number
  y: number
  weapon: WeaponId
  life: number
  bob: number
}

export type Enemy = {
  id: string
  x: number
  y: number
  w: number
  h: number
  hp: number
  maxHp: number
  vx: number
  kind: 'grunt' | 'flyer' | 'heavy' | 'midboss' | 'boss'
  name?: string
  t: number
  fireCd: number
  facing: 1 | -1
  grounded?: boolean
  phase?: number
  dead?: boolean
}

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
  glow?: boolean
}

export type Rect = { x: number; y: number; w: number; h: number }

export function aabb(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function rand(a: number, b: number) {
  return a + Math.random() * (b - a)
}
