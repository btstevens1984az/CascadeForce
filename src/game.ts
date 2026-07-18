import { Input } from './engine/input'
import { Particles } from './engine/particles'
import { Sfx } from './audio/sfx'
import {
  aabb, clamp, lerp, rand, type Bullet, type Enemy, type Pickup, type WeaponId,
} from './engine/types'
import { DROP_TABLE, WEAPONS, fireWeapon } from './weapons/arsenal'
import { LEVELS, type LevelTheme } from './levels/themes'
import { BRIEFINGS, INTRO, VICTORY } from './story/beats'

type Mode = 'title' | 'brief' | 'play' | 'bossbanner' | 'clear' | 'dead' | 'win'

export class Game {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  input = new Input()
  fx = new Particles()
  sfx = new Sfx()

  w = 1280
  h = 720
  mode: Mode = 'title'
  levelIndex = 0
  level!: LevelTheme

  // player
  px = 120
  py = 0
  pvx = 0
  pvy = 0
  facing: 1 | -1 = 1
  onGround = false
  ducking = false
  hp = 100
  maxHp = 100
  lives = 3
  invuln = 0
  weapon: WeaponId = 'pulse'
  fireCd = 0
  score = 0
  jumpBuffered = false

  camX = 0
  shake = 0
  t = 0
  spawnTimer = 0
  midSpawned = false
  bossSpawned = false
  bannerTimer = 0
  bannerText = ''
  clearTimer = 0

  platforms: { x: number; y: number; w: number; h: number }[] = []
  bullets: Bullet[] = []
  enemies: Enemy[] = []
  pickups: Pickup[] = []

  groundY = 620
  storyLines: string[] = []
  storyTitle = ''

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.resize()
    window.addEventListener('resize', () => this.resize())
    this.showTitle()
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const rect = this.canvas.parentElement?.getBoundingClientRect()
    const cssW = rect?.width || window.innerWidth
    const cssH = rect?.height || window.innerHeight
    this.canvas.width = Math.floor(cssW * dpr)
    this.canvas.height = Math.floor(cssH * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.w = cssW
    this.h = cssH
    this.groundY = this.h * 0.86
  }

  showTitle() {
    this.mode = 'title'
    this.storyTitle = INTRO.title
    this.storyLines = INTRO.body
    this.levelIndex = 0
    this.score = 0
    this.lives = 3
    this.syncHud()
  }

  startBrief(level: number) {
    this.levelIndex = level
    this.level = LEVELS[level]
    const b = BRIEFINGS[level as 0 | 1 | 2]
    this.mode = 'brief'
    this.storyTitle = b.title
    this.storyLines = b.body
    this.syncHud()
  }

  startLevel() {
    this.level = LEVELS[this.levelIndex]
    this.mode = 'play'
    this.px = 140
    this.py = this.groundY - 64
    this.pvx = 0
    this.pvy = 0
    this.hp = this.maxHp
    this.weapon = 'pulse'
    this.fireCd = 0
    this.invuln = 1.2
    this.camX = 0
    this.t = 0
    this.spawnTimer = 0.5
    this.midSpawned = false
    this.bossSpawned = false
    this.bullets = []
    this.enemies = []
    this.pickups = []
    this.fx.list = []
    this.buildPlatforms()
    this.syncHud()
  }

  buildPlatforms() {
    const L = this.level.length
    this.platforms = [
      { x: 0, y: this.groundY, w: L + 800, h: 200 },
    ]
    for (let x = 420; x < L - 400; x += rand(280, 420)) {
      const y = this.groundY - rand(90, 220)
      this.platforms.push({ x, y, w: rand(120, 220), h: 18 })
    }
  }

  private el(id: string) {
    return document.getElementById(id)
  }

  private showPanel(which: 'title' | 'story' | 'overlay' | 'none') {
    this.el('title')?.classList.toggle('hidden', which !== 'title')
    this.el('story')?.classList.toggle('hidden', which !== 'story')
    this.el('overlay')?.classList.toggle('hidden', which !== 'overlay')
    const playing = which === 'none'
    this.el('hud')?.classList.toggle('hidden', !playing)
  }

  syncHud() {
    const set = (id: string, v: string) => {
      const el = this.el(id)
      if (el) el.textContent = v
    }
    set('levelTitle', this.level ? this.level.name : 'CASCADE FORCE')
    set('weaponName', WEAPONS[this.weapon]?.name || 'PULSE RIFLE')
    set('score', String(this.score).padStart(6, '0'))
    set('lives', String(Math.max(0, this.lives)))
    const bar = this.el('hpBar')
    if (bar) bar.style.transform = `scaleX(${clamp(this.hp / this.maxHp, 0, 1)})`

    let objective = 'Advance'
    if (this.bossSpawned) objective = `Defeat ${this.level.bossName}`
    else if (this.midSpawned && this.enemies.some((e) => e.kind === 'midboss' && !e.dead)) {
      objective = `Defeat ${this.level.midBossName}`
    } else if (this.midSpawned) objective = 'Push to the primary target'
    set('objective', objective)

    if (this.mode === 'title') {
      this.showPanel('title')
    } else if (this.mode === 'brief') {
      set('storyChapter', `OPERATION ${this.levelIndex + 1} / 3`)
      set('storyTitle', this.storyTitle)
      const body = this.el('storyBody')
      if (body) body.innerHTML = this.storyLines.map((l) => `${l}<br/><br/>`).join('')
      this.showPanel('story')
    } else if (this.mode === 'dead' || this.mode === 'clear' || this.mode === 'win') {
      set('overlayTitle', this.storyTitle)
      const body = this.el('overlayBody')
      if (body) body.innerHTML = this.storyLines.map((l) => `${l}<br/><br/>`).join('')
      const btn = this.el('overlayBtn')
      if (btn) {
        btn.textContent =
          this.mode === 'dead' ? 'RETRY OPERATION' : this.mode === 'win' ? 'RETURN TO TITLE' : 'CONTINUE'
      }
      this.showPanel('overlay')
    } else {
      this.showPanel('none')
    }
  }

  /** Wired from HTML buttons. */
  onStartClick() {
    if (this.mode === 'title') this.startBrief(0)
  }

  onStoryClick() {
    if (this.mode === 'brief') this.startLevel()
  }

  onOverlayClick() {
    if (this.mode === 'dead') this.startLevel()
    else if (this.mode === 'clear') {
      if (this.levelIndex >= 2) {
        this.mode = 'win'
        this.storyTitle = VICTORY.title
        this.storyLines = VICTORY.body
        this.sfx.win()
        this.syncHud()
      } else {
        this.startBrief(this.levelIndex + 1)
      }
    } else if (this.mode === 'win') this.showTitle()
  }

  update(dt: number) {
    this.t += dt
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 8)

    if (this.mode === 'title') {
      if (this.input.confirm() || this.input.just('Enter')) this.startBrief(0)
      this.input.endFrame()
      return
    }

    if (this.mode === 'brief') {
      if (this.input.confirm() || this.input.just('Enter')) this.startLevel()
      this.input.endFrame()
      return
    }

    if (this.mode === 'dead') {
      if (this.input.confirm() || this.input.just('Enter')) this.startLevel()
      if (this.input.just('Escape')) this.showTitle()
      this.input.endFrame()
      return
    }

    if (this.mode === 'clear') {
      this.clearTimer -= dt
      if ((this.input.confirm() || this.input.just('Enter')) && this.clearTimer < 2.4) {
        this.onOverlayClick()
      }
      this.input.endFrame()
      return
    }

    if (this.mode === 'win') {
      if (this.input.confirm() || this.input.just('Enter')) this.showTitle()
      this.input.endFrame()
      return
    }

    if (this.mode === 'bossbanner') {
      this.bannerTimer -= dt
      if (this.bannerTimer <= 0) this.mode = 'play'
    }

    if (this.mode !== 'play' && this.mode !== 'bossbanner') {
      this.input.endFrame()
      return
    }

    this.updatePlayer(dt)
    this.updateSpawns(dt)
    this.updateEnemies(dt)
    this.updateBullets(dt)
    this.updatePickups(dt)
    this.fx.update(dt)

    const target = this.px - this.w * 0.35
    this.camX = lerp(this.camX, clamp(target, 0, this.level.length - this.w), 1 - Math.pow(0.001, dt))

    if (this.bossSpawned && !this.enemies.some((e) => e.kind === 'boss' && !e.dead)) {
      this.mode = 'clear'
      this.clearTimer = 3
      this.storyTitle = `${this.level.name} — CLEARED`
      this.storyLines = ['Sector secured. Cascade nodes offline in this theater.', 'Gear up for the next drop.']
      this.sfx.win()
    }

    this.syncHud()
    this.input.endFrame()
  }

  updatePlayer(dt: number) {
    const move = this.input.moveX()
    const speed = 340
    this.pvx = move * speed
    if (move !== 0) this.facing = move > 0 ? 1 : -1
    this.ducking = this.input.duck() && this.onGround

    if ((this.input.just('KeyW') || this.input.just('Space') || this.input.just('KeyK') || this.input.just('ArrowUp')) && this.onGround) {
      this.pvy = -640
      this.onGround = false
      this.sfx.jump()
    } else if (this.input.jump() && this.pvy < -120) {
      // hold for slightly higher hop
      this.pvy -= 520 * dt
    }

    this.pvy += 1700 * dt
    this.px += this.pvx * dt
    this.py += this.pvy * dt

    // collide platforms
    this.onGround = false
    const pw = 28
    const ph = this.ducking ? 36 : 52
    for (const p of this.platforms) {
      const pret = { x: this.px - pw / 2, y: this.py, w: pw, h: ph }
      if (!aabb(pret, p)) continue
      // land on top
      if (this.pvy >= 0 && this.py + ph - this.pvy * dt <= p.y + 8) {
        this.py = p.y - ph
        this.pvy = 0
        this.onGround = true
      }
    }

    this.px = clamp(this.px, 40, this.level.length - 40)
    if (this.py > this.h + 200) this.hurt(999)

    if (this.invuln > 0) this.invuln -= dt
    this.fireCd = Math.max(0, this.fireCd - dt)

    if (this.input.fire() && this.fireCd <= 0) {
      const def = WEAPONS[this.weapon]
      this.fireCd = def.cooldown / (1 + this.levelIndex * 0.05)
      const muzzleY = this.py + (this.ducking ? 18 : 22)
      const muzzleX = this.px + this.facing * 22
      const shots = fireWeapon(this.weapon, muzzleX, muzzleY, this.facing, this.ducking)
      this.bullets.push(...shots)
      this.sfx.shoot(this.weapon)
      if (this.weapon === 'inferno') this.fx.flame(muzzleX, muzzleY, this.facing)
    }
  }

  updateSpawns(dt: number) {
    if (this.bossSpawned) return
    const prog = this.camX + this.w * 0.55

    if (!this.midSpawned && prog >= this.level.midBossAt) {
      this.spawnMidBoss()
      return
    }
    if (this.midSpawned && !this.bossSpawned && prog >= this.level.bossAt) {
      if (!this.enemies.some((e) => e.kind === 'midboss' && !e.dead)) this.spawnBoss()
      return
    }

    // don't spam during midboss
    if (this.enemies.some((e) => (e.kind === 'midboss' || e.kind === 'boss') && !e.dead)) return

    this.spawnTimer -= dt
    if (this.spawnTimer > 0) return
    this.spawnTimer = this.level.enemyRate * rand(0.7, 1.2)

    const kinds: Enemy['kind'][] = ['grunt', 'grunt', 'flyer', 'heavy']
    const kind = kinds[Math.floor(Math.random() * kinds.length)]
    const x = this.camX + this.w + rand(40, 160)
    if (kind === 'flyer') this.spawnEnemy(kind, x, this.groundY - rand(160, 320))
    else this.spawnEnemy(kind, x, this.groundY - 52)
  }

  spawnEnemy(kind: Enemy['kind'], x: number, y: number, overrides: Partial<Enemy> = {}) {
    const d = this.level.difficulty
    const base: Record<string, Partial<Enemy>> = {
      grunt: { w: 34, h: 46, hp: 28 * d, vx: -80 },
      flyer: { w: 40, h: 28, hp: 22 * d, vx: -120 },
      heavy: { w: 48, h: 56, hp: 70 * d, vx: -55 },
    }
    const b = base[kind] || { w: 40, h: 40, hp: 40, vx: -80 }
    const e: Enemy = {
      id: Math.random().toString(36).slice(2),
      x, y,
      w: b.w!, h: b.h!,
      hp: b.hp!, maxHp: b.hp!,
      vx: b.vx!,
      kind,
      t: 0,
      fireCd: rand(0.4, 1.2),
      facing: -1,
      ...overrides,
    }
    e.maxHp = e.hp
    this.enemies.push(e)
  }

  spawnMidBoss() {
    this.midSpawned = true
    const x = this.camX + this.w * 0.72
    this.spawnEnemy('midboss', x, this.groundY - 90, {
      w: 110, h: 90,
      hp: this.level.midBossHp,
      maxHp: this.level.midBossHp,
      vx: -20,
      name: this.level.midBossName,
      phase: 0,
    })
    this.banner(this.level.midBossName)
    this.shake = 1.2
  }

  spawnBoss() {
    this.bossSpawned = true
    const x = this.camX + this.w * 0.7
    this.spawnEnemy('boss', x, this.groundY - 140, {
      w: 150, h: 140,
      hp: this.level.bossHp,
      maxHp: this.level.bossHp,
      vx: -10,
      name: this.level.bossName,
      phase: 0,
    })
    this.banner(this.level.bossName)
    this.shake = 1.8
  }

  banner(name: string) {
    this.mode = 'bossbanner'
    this.bannerTimer = 1.6
    this.bannerText = name
  }

  updateEnemies(dt: number) {
    const next: Enemy[] = []
    for (const e of this.enemies) {
      if (e.dead) continue
      e.t += dt
      e.fireCd -= dt

      if (e.kind === 'flyer') {
        e.x += e.vx * dt
        e.y += Math.sin(e.t * 3) * 40 * dt
      } else if (e.kind === 'grunt' || e.kind === 'heavy') {
        e.x += e.vx * dt
        e.y = this.groundY - e.h
      } else if (e.kind === 'midboss' || e.kind === 'boss') {
        // keep in view, patrol
        const targetX = this.camX + this.w * 0.68 + Math.sin(e.t * 0.7) * 40
        e.x = lerp(e.x, targetX, 1 - Math.pow(0.02, dt))
        e.y = this.groundY - e.h + (e.kind === 'boss' ? Math.sin(e.t * 1.2) * 8 : 0)
        const ratio = e.hp / e.maxHp
        e.phase = ratio < 0.35 ? 2 : ratio < 0.7 ? 1 : 0
      }

      // shoot at player
      if (e.fireCd <= 0 && e.x - this.camX < this.w + 40) {
        this.enemyFire(e)
      }

      // touch damage
      const ph = this.ducking ? 36 : 52
      if (this.invuln <= 0 && aabb(
        { x: this.px - 14, y: this.py, w: 28, h: ph },
        { x: e.x - e.w / 2, y: e.y, w: e.w, h: e.h },
      )) {
        this.hurt(e.kind === 'boss' ? 28 : e.kind === 'midboss' ? 20 : 14)
      }

      if (e.x < this.camX - 200) continue
      next.push(e)
    }
    this.enemies = next
  }

  enemyFire(e: Enemy) {
    const dx = this.px - e.x
    const dy = (this.py + 20) - (e.y + e.h * 0.4)
    const len = Math.hypot(dx, dy) || 1
    const d = this.level.difficulty

    if (e.kind === 'grunt') {
      e.fireCd = 1.4 / d
      this.bullets.push({
        x: e.x, y: e.y + 20, vx: (dx / len) * 320, vy: (dy / len) * 320,
        life: 2.2, damage: 10, radius: 5, fromPlayer: false, weapon: 'pulse', color: '#ff6b6b',
      })
    } else if (e.kind === 'flyer') {
      e.fireCd = 1.1 / d
      this.bullets.push({
        x: e.x, y: e.y + 10, vx: (dx / len) * 380, vy: (dy / len) * 380,
        life: 2, damage: 8, radius: 4, fromPlayer: false, weapon: 'pulse', color: '#ff9f43',
      })
    } else if (e.kind === 'heavy') {
      e.fireCd = 1.8 / d
      for (let i = -1; i <= 1; i++) {
        this.bullets.push({
          x: e.x, y: e.y + 24, vx: -280, vy: i * 90,
          life: 2.5, damage: 14, radius: 6, fromPlayer: false, weapon: 'pulse', color: '#ff4757',
        })
      }
    } else if (e.kind === 'midboss') {
      const phase = e.phase || 0
      e.fireCd = (phase === 2 ? 0.35 : phase === 1 ? 0.55 : 0.8) / Math.sqrt(d)
      const n = 3 + phase * 2
      for (let i = 0; i < n; i++) {
        const a = Math.atan2(dy, dx) + (i - (n - 1) / 2) * 0.18
        this.bullets.push({
          x: e.x - 30, y: e.y + e.h * 0.35,
          vx: Math.cos(a) * (300 + phase * 40),
          vy: Math.sin(a) * (300 + phase * 40),
          life: 3, damage: 12, radius: 6, fromPlayer: false, weapon: 'pulse', color: this.level.accent,
        })
      }
    } else if (e.kind === 'boss') {
      const phase = e.phase || 0
      e.fireCd = (phase === 2 ? 0.22 : phase === 1 ? 0.38 : 0.55) / Math.sqrt(d)
      // ring + aimed
      const n = 8 + phase * 4
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + e.t
        this.bullets.push({
          x: e.x, y: e.y + e.h * 0.4,
          vx: Math.cos(a) * (220 + phase * 50),
          vy: Math.sin(a) * (220 + phase * 50),
          life: 3.5, damage: 14, radius: 7, fromPlayer: false, weapon: 'pulse', color: '#ff3d5a',
        })
      }
      // aimed volley on hard phases
      if (phase >= 1) {
        for (let i = -2; i <= 2; i++) {
          const a = Math.atan2(dy, dx) + i * 0.12
          this.bullets.push({
            x: e.x - 40, y: e.y + 40,
            vx: Math.cos(a) * 420, vy: Math.sin(a) * 420,
            life: 2.8, damage: 16, radius: 5, fromPlayer: false, weapon: 'pulse', color: '#ffe66d',
          })
        }
      }
      // final boss extra hell
      if (this.levelIndex === 2 && phase === 2 && Math.random() < 0.4) {
        for (let i = 0; i < 5; i++) {
          this.bullets.push({
            x: this.camX + rand(100, this.w - 100), y: -20,
            vx: rand(-40, 40), vy: rand(220, 360),
            life: 4, damage: 18, radius: 8, fromPlayer: false, weapon: 'pulse', color: '#ff9ff3',
          })
        }
      }
    }
  }

  updateBullets(dt: number) {
    const next: Bullet[] = []
    for (const b of this.bullets) {
      b.life -= dt
      if (b.life <= 0) continue

      if (b.homing && b.fromPlayer) {
        let best: Enemy | null = null
        let bestD = 9999
        for (const e of this.enemies) {
          if (e.dead) continue
          const d = Math.hypot(e.x - b.x, e.y + e.h / 2 - b.y)
          if (d < bestD) { bestD = d; best = e }
        }
        if (best) {
          const dx = best.x - b.x
          const dy = best.y + best.h / 2 - b.y
          const len = Math.hypot(dx, dy) || 1
          b.vx = lerp(b.vx, (dx / len) * 520, 1 - Math.pow(0.05, dt))
          b.vy = lerp(b.vy, (dy / len) * 520, 1 - Math.pow(0.05, dt))
        }
      }

      b.x += b.vx * dt
      b.y += b.vy * dt
      if (b.flame) this.fx.flame(b.x, b.y, Math.sign(b.vx) || 1)

      if (b.fromPlayer) {
        let hit = false
        for (const e of this.enemies) {
          if (e.dead) continue
          if (Math.hypot(b.x - e.x, b.y - (e.y + e.h / 2)) < b.radius + e.w * 0.35) {
            e.hp -= b.damage
            hit = true
            this.fx.burst(b.x, b.y, b.color, 6, 160)
            if (e.hp <= 0) this.killEnemy(e)
            if (b.pierce && b.pierce > 0) {
              b.pierce--
              hit = false
            }
            if (hit) break
          }
        }
        if (hit) continue
      } else {
        const ph = this.ducking ? 36 : 52
        if (this.invuln <= 0 && aabb(
          { x: b.x - b.radius, y: b.y - b.radius, w: b.radius * 2, h: b.radius * 2 },
          { x: this.px - 14, y: this.py, w: 28, h: ph },
        )) {
          this.hurt(b.damage)
          this.fx.burst(b.x, b.y, '#fff', 8, 180)
          continue
        }
      }

      if (b.x < this.camX - 80 || b.x > this.camX + this.w + 80 || b.y < -80 || b.y > this.h + 80) continue
      next.push(b)
    }
    this.bullets = next
  }

  killEnemy(e: Enemy) {
    e.dead = true
    e.hp = 0
    this.sfx.boom()
    this.fx.burst(e.x, e.y + e.h / 2, this.level.accent, 28, 340)
    this.shake = Math.max(this.shake, e.kind === 'boss' ? 1.6 : e.kind === 'midboss' ? 1.1 : 0.35)
    const pts = e.kind === 'boss' ? 5000 : e.kind === 'midboss' ? 2000 : e.kind === 'heavy' ? 300 : e.kind === 'flyer' ? 200 : 100
    this.score += pts

    // drops
    if (e.kind === 'midboss' || e.kind === 'boss' || Math.random() < 0.18) {
      const w = DROP_TABLE[Math.floor(Math.random() * DROP_TABLE.length)]
      // bosses guarantee strong drops
      const weapon = e.kind === 'boss' ? (['railstorm', 'swarm', 'inferno'] as WeaponId[])[this.levelIndex]
        : e.kind === 'midboss' ? (['hyperspread', 'plasma', 'swarm'] as WeaponId[])[this.levelIndex]
        : w
      this.pickups.push({ x: e.x, y: e.y, weapon, life: 12, bob: 0 })
    }
  }

  updatePickups(dt: number) {
    const next: Pickup[] = []
    for (const p of this.pickups) {
      p.life -= dt
      p.bob += dt * 4
      if (p.life <= 0) continue
      if (Math.hypot(p.x - this.px, p.y - this.py) < 40) {
        this.weapon = p.weapon
        this.sfx.pickup()
        this.fx.burst(p.x, p.y, WEAPONS[p.weapon].color, 16, 200)
        continue
      }
      next.push(p)
    }
    this.pickups = next
  }

  hurt(amount: number) {
    if (this.invuln > 0 && amount < 900) return
    this.hp -= amount
    this.invuln = 1.1
    this.shake = 0.8
    this.sfx.hurt()
    if (this.hp <= 0) {
      this.lives--
      if (this.lives < 0) {
        this.mode = 'dead'
        this.storyTitle = 'UNIT DOWN'
        this.storyLines = ['Cascade forces overrun your position.', 'Retry the operation or abort to title.']
        this.lives = 3
        this.syncHud()
      } else {
        this.hp = this.maxHp
        this.px = this.camX + 120
        this.py = this.groundY - 64
        this.invuln = 2
        this.weapon = 'pulse'
      }
    }
  }

  draw() {
    const ctx = this.ctx
    const L = this.level || LEVELS[0]
    const ox = (Math.random() - 0.5) * this.shake * 12
    const oy = (Math.random() - 0.5) * this.shake * 12
    ctx.save()
    ctx.translate(ox, oy)

    // sky
    const g = ctx.createLinearGradient(0, 0, 0, this.h)
    g.addColorStop(0, L.skyTop)
    g.addColorStop(1, L.skyBot)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, this.w, this.h)

    this.drawParallax(L)
    this.drawPlatforms(L)
    this.drawPickups()
    this.drawEnemies()
    this.drawPlayer()
    this.drawBullets()
    this.fx.draw(ctx, this.camX)

    // vignette
    const vg = ctx.createRadialGradient(this.w / 2, this.h / 2, this.h * 0.2, this.w / 2, this.h / 2, this.h * 0.75)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, 'rgba(0,0,0,0.45)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, this.w, this.h)

    if (this.mode === 'bossbanner') {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      ctx.fillRect(0, this.h * 0.38, this.w, 90)
      ctx.fillStyle = L.accent
      ctx.font = 'bold 36px Trebuchet MS, Segoe UI, sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowBlur = 20
      ctx.shadowColor = L.accent
      ctx.fillText(`⚠ ${this.bannerText}`, this.w / 2, this.h * 0.38 + 58)
      ctx.shadowBlur = 0
    }

    // progress
    if (this.mode === 'play' || this.mode === 'bossbanner') {
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(40, this.h - 18, this.w - 80, 4)
      ctx.fillStyle = L.accent
      ctx.fillRect(40, this.h - 18, (this.w - 80) * clamp(this.camX / (L.length - this.w), 0, 1), 4)
    }

    ctx.restore()
  }

  drawParallax(L: LevelTheme) {
    const ctx = this.ctx
    // far silhouettes
    for (let i = 0; i < 12; i++) {
      const x = ((i * 220 - this.camX * 0.15) % (this.w + 220)) - 40
      const h = 80 + (i % 5) * 30
      ctx.fillStyle = L.mist
      ctx.beginPath()
      ctx.moveTo(x, this.groundY)
      ctx.lineTo(x + 60, this.groundY - h)
      ctx.lineTo(x + 140, this.groundY)
      ctx.fill()
    }
    // mid trees / towers
    for (let i = 0; i < 18; i++) {
      const worldX = i * 380
      const x = worldX - this.camX * 0.45
      if (x < -100 || x > this.w + 100) continue
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      if (L.id === 0) {
        ctx.fillRect(x, this.groundY - 160, 18, 160)
        ctx.beginPath()
        ctx.arc(x + 9, this.groundY - 170, 40, 0, Math.PI * 2)
        ctx.fill()
      } else if (L.id === 1) {
        ctx.fillRect(x, this.groundY - 220, 36, 220)
        ctx.fillRect(x - 10, this.groundY - 240, 56, 20)
      } else {
        ctx.fillRect(x + 10, this.groundY - 280, 24, 280)
        ctx.fillStyle = 'rgba(255,60,80,0.15)'
        ctx.fillRect(x + 14, this.groundY - 260, 16, 40)
      }
    }

    // neon scanlines accent
    ctx.fillStyle = L.mist
    for (let y = 0; y < this.h; y += 4) {
      if (y % 8 === 0) ctx.fillRect(0, y, this.w, 1)
    }
  }

  drawPlatforms(L: LevelTheme) {
    const ctx = this.ctx
    for (const p of this.platforms) {
      const x = p.x - this.camX
      if (x + p.w < 0 || x > this.w) continue
      if (p.y >= this.groundY - 1) {
        // ground
        const gg = ctx.createLinearGradient(0, p.y, 0, this.h)
        gg.addColorStop(0, L.ground)
        gg.addColorStop(1, '#050508')
        ctx.fillStyle = gg
        ctx.fillRect(x, p.y, p.w, this.h - p.y + 40)
        ctx.fillStyle = L.accent
        ctx.globalAlpha = 0.55
        ctx.fillRect(x, p.y, p.w, 3)
        ctx.globalAlpha = 1
      } else {
        ctx.fillStyle = '#1a1a22'
        ctx.fillRect(x, p.y, p.w, p.h)
        ctx.fillStyle = L.accent
        ctx.globalAlpha = 0.7
        ctx.fillRect(x, p.y, p.w, 3)
        ctx.globalAlpha = 1
      }
    }
  }

  drawPlayer() {
    const ctx = this.ctx
    const x = this.px - this.camX
    const ph = this.ducking ? 36 : 52
    if (this.invuln > 0 && Math.floor(this.t * 20) % 2 === 0) return

    // glow
    ctx.shadowBlur = 18
    ctx.shadowColor = '#39e6ff'
    // body
    ctx.fillStyle = '#d8e7ff'
    ctx.fillRect(x - 12, this.py + 8, 24, ph - 12)
    // helmet
    ctx.fillStyle = '#39e6ff'
    ctx.fillRect(x - 10, this.py, 20, 14)
    // gun
    ctx.fillStyle = WEAPONS[this.weapon].color
    ctx.fillRect(x + (this.facing > 0 ? 10 : -28), this.py + 20, 22, 6)
    // thruster boots
    ctx.fillStyle = '#ff5ad5'
    ctx.fillRect(x - 10, this.py + ph - 8, 8, 8)
    ctx.fillRect(x + 2, this.py + ph - 8, 8, 8)
    ctx.shadowBlur = 0

    // muzzle flash
    if (this.input.fire() && this.fireCd > WEAPONS[this.weapon].cooldown * 0.7) {
      ctx.fillStyle = '#fff'
      ctx.globalAlpha = 0.8
      ctx.beginPath()
      ctx.arc(x + this.facing * 28, this.py + 22, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  drawEnemies() {
    const ctx = this.ctx
    for (const e of this.enemies) {
      if (e.dead) continue
      const x = e.x - this.camX
      if (x < -120 || x > this.w + 120) continue

      ctx.shadowBlur = 16
      ctx.shadowColor = this.level.accent

      if (e.kind === 'grunt') {
        ctx.fillStyle = '#c44'
        ctx.fillRect(x - e.w / 2, e.y, e.w, e.h)
        ctx.fillStyle = '#211'
        ctx.fillRect(x - 8, e.y + 10, 16, 10)
      } else if (e.kind === 'flyer') {
        ctx.fillStyle = '#e67e22'
        ctx.beginPath()
        ctx.moveTo(x - e.w / 2, e.y + e.h / 2)
        ctx.lineTo(x + e.w / 2, e.y)
        ctx.lineTo(x + e.w / 2, e.y + e.h)
        ctx.fill()
      } else if (e.kind === 'heavy') {
        ctx.fillStyle = '#7f8c8d'
        ctx.fillRect(x - e.w / 2, e.y, e.w, e.h)
        ctx.fillStyle = '#e74c3c'
        ctx.fillRect(x - e.w / 2 + 6, e.y + 12, e.w - 12, 10)
      } else if (e.kind === 'midboss') {
        ctx.fillStyle = '#2c3e50'
        ctx.fillRect(x - e.w / 2, e.y, e.w, e.h)
        ctx.fillStyle = this.level.accent
        ctx.fillRect(x - e.w / 2 + 10, e.y + 20, e.w - 20, 16)
        ctx.fillRect(x - e.w / 2 - 20, e.y + e.h - 20, 20, 12)
        ctx.fillRect(x + e.w / 2, e.y + e.h - 20, 20, 12)
        // hp
        this.drawBossBar(e)
      } else if (e.kind === 'boss') {
        const pulse = 0.5 + Math.sin(this.t * 6) * 0.5
        ctx.fillStyle = '#1a0a0a'
        ctx.fillRect(x - e.w / 2, e.y, e.w, e.h)
        ctx.fillStyle = `rgba(255,61,90,${0.5 + pulse * 0.5})`
        ctx.fillRect(x - e.w / 2 + 16, e.y + 30, e.w - 32, 40)
        ctx.fillStyle = '#ffe66d'
        ctx.beginPath()
        ctx.arc(x, e.y + 50, 18 + pulse * 6, 0, Math.PI * 2)
        ctx.fill()
        // claws
        ctx.fillStyle = '#ff3d5a'
        ctx.fillRect(x - e.w / 2 - 30, e.y + 40, 30, 10)
        ctx.fillRect(x + e.w / 2, e.y + 40, 30, 10)
        this.drawBossBar(e)
      }
      ctx.shadowBlur = 0
    }
  }

  drawBossBar(e: Enemy) {
    const ctx = this.ctx
    const bw = 360
    const bx = (this.w - bw) / 2
    const by = 56
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(bx - 4, by - 18, bw + 8, 28)
    ctx.fillStyle = '#fff'
    ctx.font = '12px Trebuchet MS, Segoe UI, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(e.name || 'BOSS', this.w / 2, by - 4)
    ctx.fillStyle = '#333'
    ctx.fillRect(bx, by + 2, bw, 8)
    ctx.fillStyle = this.level.accent
    ctx.fillRect(bx, by + 2, bw * clamp(e.hp / e.maxHp, 0, 1), 8)
  }

  drawBullets() {
    const ctx = this.ctx
    for (const b of this.bullets) {
      const x = b.x - this.camX
      ctx.shadowBlur = 12
      ctx.shadowColor = b.color
      ctx.fillStyle = b.color
      if (b.flame) {
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.arc(x, b.y, b.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      } else {
        ctx.fillRect(x - b.radius, b.y - b.radius * 0.6, b.radius * 2.4, b.radius * 1.2)
      }
      ctx.shadowBlur = 0
    }
  }

  drawPickups() {
    const ctx = this.ctx
    for (const p of this.pickups) {
      const x = p.x - this.camX
      const y = p.y + Math.sin(p.bob) * 6
      const col = WEAPONS[p.weapon].color
      ctx.shadowBlur = 20
      ctx.shadowColor = col
      ctx.fillStyle = col
      ctx.fillRect(x - 14, y - 14, 28, 28)
      ctx.fillStyle = '#0a0a10'
      ctx.font = 'bold 14px Trebuchet MS, Segoe UI, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(p.weapon[0]!.toUpperCase(), x, y + 5)
      ctx.shadowBlur = 0
    }
  }

  start() {
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      this.update(dt)
      this.draw()
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }
}
