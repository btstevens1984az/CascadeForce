import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { Input } from './engine/input'
import { Sfx } from './audio/sfx'
import {
  aabb, clamp, lerp, rand, hexToInt,
  type Bullet, type Enemy, type Pickup, type WeaponId,
} from './engine/types'
import { DROP_TABLE, WEAPONS, fireWeapon } from './weapons/arsenal'
import { LEVELS, type LevelTheme } from './levels/themes'
import { BRIEFINGS, INTRO, VICTORY } from './story/beats'
import { WorldBuilder } from './render/world'
import { FxSystem } from './render/particles3d'
import {
  createSoldier, createGrunt, createFlyer, createHeavy,
  createMidBoss, createBoss, createPickupMesh, createBulletMesh,
} from './render/models'

type Mode = 'title' | 'brief' | 'play' | 'bossbanner' | 'clear' | 'dead' | 'win'

export class Game {
  canvas: HTMLCanvasElement
  input = new Input()
  sfx = new Sfx()

  renderer: THREE.WebGLRenderer
  scene = new THREE.Scene()
  camera: THREE.PerspectiveCamera
  composer: EffectComposer
  bloom: UnrealBloomPass
  world = new WorldBuilder()
  fx = new FxSystem()
  root = new THREE.Group()
  hemi!: THREE.HemisphereLight
  keyLight!: THREE.DirectionalLight
  fill!: THREE.PointLight
  rim!: THREE.PointLight

  w = 1280
  h = 720
  mode: Mode = 'title'
  levelIndex = 0
  level!: LevelTheme

  px = 4
  py = 0
  pvx = 0
  pvy = 0
  facing: 1 | -1 = 1
  onGround = false
  ducking = false
  aimingUp = false
  hp = 100
  maxHp = 100
  lives = 3
  invuln = 0
  weapon: WeaponId = 'pulse'
  fireCd = 0
  score = 0

  camX = 0
  shake = 0
  t = 0
  spawnTimer = 0
  midSpawned = false
  bossSpawned = false
  bannerTimer = 0
  bannerText = ''
  clearTimer = 0

  bullets: Bullet[] = []
  enemies: Enemy[] = []
  pickups: Pickup[] = []
  playerMesh = createSoldier()
  muzzleLight = new THREE.PointLight(0x9dffc2, 0, 8, 2)

  storyLines: string[] = []
  storyTitle = ''

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 200)
    this.camera.position.set(0, 3.2, 14)

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1280, 720), 0.85, 0.55, 0.2)
    this.composer.addPass(this.bloom)

    this.scene.add(this.root)
    this.root.add(this.world.group)
    this.root.add(this.fx.group)
    this.root.add(this.playerMesh)
    this.playerMesh.add(this.muzzleLight)
    this.muzzleLight.position.set(0.7, 1.05, 0.2)

    this.hemi = new THREE.HemisphereLight(0x9eb7ff, 0x1a1018, 0.55)
    this.scene.add(this.hemi)
    this.keyLight = new THREE.DirectionalLight(0xfff0e0, 1.4)
    this.keyLight.position.set(8, 18, 10)
    this.keyLight.castShadow = true
    this.keyLight.shadow.mapSize.set(2048, 2048)
    this.keyLight.shadow.camera.near = 1
    this.keyLight.shadow.camera.far = 60
    this.keyLight.shadow.camera.left = -20
    this.keyLight.shadow.camera.right = 20
    this.keyLight.shadow.camera.top = 15
    this.keyLight.shadow.camera.bottom = -5
    this.scene.add(this.keyLight)
    this.fill = new THREE.PointLight(0x39e6ff, 1.2, 40)
    this.fill.position.set(0, 4, 6)
    this.scene.add(this.fill)
    this.rim = new THREE.PointLight(0xff3d5a, 0.9, 35)
    this.rim.position.set(0, 3, -4)
    this.scene.add(this.rim)

    this.resize()
    window.addEventListener('resize', () => this.resize())
    this.showTitle()
  }

  resize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect()
    this.w = rect?.width || window.innerWidth
    this.h = rect?.height || window.innerHeight
    this.renderer.setSize(this.w, this.h, false)
    this.composer.setSize(this.w, this.h)
    this.bloom.setSize(this.w, this.h)
    this.camera.aspect = this.w / Math.max(1, this.h)
    this.camera.updateProjectionMatrix()
  }

  private el(id: string) {
    return document.getElementById(id)
  }

  private showPanel(which: 'title' | 'story' | 'overlay' | 'none') {
    this.el('title')?.classList.toggle('hidden', which !== 'title')
    this.el('story')?.classList.toggle('hidden', which !== 'story')
    this.el('overlay')?.classList.toggle('hidden', which !== 'overlay')
    this.el('hud')?.classList.toggle('hidden', which !== 'none')
  }

  syncHud() {
    const set = (id: string, v: string) => {
      const n = this.el(id)
      if (n) n.textContent = v
    }
    set('levelTitle', this.level ? this.level.name : 'CASCADE FORCE')
    set('weaponName', WEAPONS[this.weapon]?.name || 'PULSE RIFLE')
    set('score', String(this.score).padStart(6, '0'))
    set('lives', String(Math.max(0, this.lives)))
    const bar = this.el('hpBar')
    if (bar) bar.style.transform = `scaleX(${clamp(this.hp / this.maxHp, 0, 1)})`

    let objective = 'Advance — W aims up · S ducks under fire'
    if (this.bossSpawned) objective = `Defeat ${this.level.bossName}`
    else if (this.midSpawned && this.enemies.some((e) => e.kind === 'midboss' && !e.dead)) {
      objective = `Defeat ${this.level.midBossName}`
    } else if (this.midSpawned) objective = 'Push to the primary target'
    set('objective', objective)

    if (this.mode === 'title') this.showPanel('title')
    else if (this.mode === 'brief') {
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
    } else this.showPanel('none')
  }

  showTitle() {
    this.mode = 'title'
    this.storyTitle = INTRO.title
    this.storyLines = INTRO.body
    this.levelIndex = 0
    this.score = 0
    this.lives = 3
    this.applyTheme(LEVELS[0]!)
    this.clearActors()
    this.world.build(LEVELS[0]!, LEVELS[0]!.length / 80)
    this.playerMesh.position.set(4, 0, 0)
    this.playerMesh.visible = true
    this.syncHud()
  }

  startBrief(level: number) {
    this.levelIndex = level
    this.level = LEVELS[level]!
    const b = BRIEFINGS[level as 0 | 1 | 2]
    this.mode = 'brief'
    this.storyTitle = b.title
    this.storyLines = b.body
    this.applyTheme(this.level)
    this.syncHud()
  }

  applyTheme(level: LevelTheme) {
    this.level = level
    const top = new THREE.Color(level.skyTop)
    const bot = new THREE.Color(level.skyBot)
    this.scene.background = top.clone().lerp(bot, 0.35)
    this.scene.fog = new THREE.FogExp2(bot.getHex(), 0.018)
    const accent = hexToInt(level.accent)
    this.fill.color.setHex(accent)
    this.rim.color.setHex(accent)
    this.bloom.strength = 0.75 + level.difficulty * 0.12
  }

  startLevel() {
    this.level = LEVELS[this.levelIndex]!
    this.applyTheme(this.level)
    this.mode = 'play'
    this.px = 3
    this.py = 0
    this.pvx = 0
    this.pvy = 0
    this.hp = this.maxHp
    this.weapon = 'pulse'
    this.fireCd = 0
    this.invuln = 1.2
    this.camX = 0
    this.t = 0
    this.spawnTimer = 0.6
    this.midSpawned = false
    this.bossSpawned = false
    this.clearActors()
    this.world.build(this.level, this.levelLen())
    this.playerMesh.visible = true
    this.syncHud()
  }

  clearActors() {
    for (const b of this.bullets) if (b.mesh) this.root.remove(b.mesh)
    for (const e of this.enemies) if (e.mesh) this.root.remove(e.mesh)
    for (const p of this.pickups) if (p.mesh) this.root.remove(p.mesh)
    this.bullets = []
    this.enemies = []
    this.pickups = []
    this.fx.clear()
  }

  levelLen() {
    return this.level.length / 80
  }

  midAt() {
    return this.level.midBossAt / 80
  }

  bossAt() {
    return this.level.bossAt / 80
  }

  onStartClick() {
    if (this.mode === 'title') this.startBrief(0)
  }

  /**
   * Deterministic action setups for README gameplay captures.
   * Scenes: combat | spread | duck | aimup | midboss | inferno
   */
  prepareCapture(scene: string) {
    const levelFor = scene === 'inferno' || scene === 'midboss' ? (scene === 'inferno' ? 1 : 0) : 0
    this.levelIndex = levelFor
    this.lives = 3
    this.score = scene === 'combat' ? 1240 : scene === 'spread' ? 3480 : 2100
    this.startLevel()
    this.invuln = 99
    this.hp = this.maxHp
    this.px = 8
    this.py = 0
    this.camX = 5
    this.spawnTimer = 99

    if (scene === 'combat') {
      this.weapon = 'pulse'
      for (let i = 0; i < 5; i++) this.spawnEnemy('grunt', 12 + i * 2.2, 0)
      this.spawnEnemy('flyer', 14, 3)
      this.spawnEnemy('heavy', 18, 0)
    } else if (scene === 'spread') {
      this.weapon = 'hyperspread'
      for (let i = 0; i < 8; i++) this.spawnEnemy(i % 2 ? 'flyer' : 'grunt', 11 + i * 1.6, i % 2 ? 2.8 : 0)
    } else if (scene === 'duck') {
      this.weapon = 'pulse'
      for (let i = 0; i < 4; i++) {
        const g = 11 + i * 2.5
        this.spawnEnemy('grunt', g, 0)
      }
      // Force immediate chest-height fire
      for (const e of this.enemies) e.fireCd = 0.05
    } else if (scene === 'aimup') {
      this.weapon = 'plasma'
      for (let i = 0; i < 6; i++) this.spawnEnemy('flyer', 11 + i * 1.8, 2.4 + (i % 3) * 0.4)
    } else if (scene === 'midboss') {
      this.weapon = 'railstorm'
      this.midSpawned = true
      this.spawnMidBoss()
      this.mode = 'play'
      this.bannerTimer = 0
    } else if (scene === 'inferno') {
      this.levelIndex = 1
      this.startLevel()
      this.invuln = 99
      this.px = 8
      this.camX = 5
      this.spawnTimer = 99
      this.weapon = 'inferno'
      for (let i = 0; i < 7; i++) this.spawnEnemy(i % 3 === 0 ? 'heavy' : 'grunt', 11 + i * 1.5, 0)
    }

    this.syncHud()
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
      } else this.startBrief(this.levelIndex + 1)
    } else if (this.mode === 'win') this.showTitle()
  }

  /** Ducking shrinks height so chest-aimed shots pass overhead. */
  playerHitbox() {
    if (this.ducking && this.onGround) {
      return { x: this.px - 0.28, y: this.py, w: 0.56, h: 0.72 }
    }
    return { x: this.px - 0.28, y: this.py, w: 0.56, h: 1.7 }
  }

  aimVector(): { ax: number; ay: number } {
    const up = this.input.aimUp()
    const down = this.input.aimDown() && !this.onGround
    const mx = this.input.moveX()
    let ax = 0
    let ay = 0

    if (this.ducking && this.onGround) {
      ax = this.facing
      ay = 0
    } else if (up && mx === 0) {
      ax = 0
      ay = 1
    } else if (up && mx !== 0) {
      ax = Math.sign(mx) || this.facing
      ay = 1
    } else if (down) {
      ax = mx !== 0 ? Math.sign(mx) || this.facing : this.facing
      ay = -1
    } else {
      ax = this.facing
      ay = 0
    }

    const len = Math.hypot(ax, ay) || 1
    return { ax: ax / len, ay: ay / len }
  }

  update(dt: number) {
    this.t += dt
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 8)

    if (this.mode === 'title') {
      if (this.input.just('Enter')) this.startBrief(0)
      this.idleCam(dt)
      this.input.endFrame()
      return
    }
    if (this.mode === 'brief') {
      if (this.input.just('Enter')) this.startLevel()
      this.idleCam(dt)
      this.input.endFrame()
      return
    }
    if (this.mode === 'dead') {
      if (this.input.just('Enter') || this.input.just('Space')) this.startLevel()
      if (this.input.just('Escape')) this.showTitle()
      this.input.endFrame()
      return
    }
    if (this.mode === 'clear') {
      this.clearTimer -= dt
      if ((this.input.just('Enter') || this.input.just('Space')) && this.clearTimer < 2.4) this.onOverlayClick()
      this.input.endFrame()
      return
    }
    if (this.mode === 'win') {
      if (this.input.just('Enter') || this.input.just('Space')) this.showTitle()
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
    this.world.update(this.t)
    this.syncMeshes()

    const target = this.px - 2.5
    this.camX = lerp(this.camX, clamp(target, 0, this.levelLen() - 8), 1 - Math.pow(0.001, dt))

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

  idleCam(_dt: number) {
    this.camera.position.x = Math.sin(this.t * 0.4) * 2
    this.camera.position.y = 3.5
    this.camera.position.z = 16
    this.camera.lookAt(0, 2, 0)
  }

  updatePlayer(dt: number) {
    const move = this.input.moveX()
    this.pvx = move * 7.2
    if (move !== 0) this.facing = move > 0 ? 1 : -1

    this.aimingUp = this.input.aimUp()
    this.ducking = this.input.duck() && this.onGround && !this.aimingUp

    if (this.input.jump() && this.onGround && !this.ducking) {
      this.pvy = 11.5
      this.onGround = false
      this.sfx.jump()
    } else if (this.input.jumpHeld() && this.pvy > 0) {
      this.pvy += 14 * dt
    }

    this.pvy -= 28 * dt
    this.px += this.pvx * dt
    this.py += this.pvy * dt

    this.onGround = false
    for (const p of this.world.platforms) {
      if (this.pvy <= 0 && this.px + 0.2 > p.x && this.px - 0.2 < p.x + p.w) {
        if (this.py <= p.y + 0.08 && this.py - this.pvy * dt >= p.y - 0.2) {
          this.py = p.y
          this.pvy = 0
          this.onGround = true
        }
      }
    }

    this.px = clamp(this.px, 1, this.levelLen() - 1)
    if (this.py < -4) this.hurt(999)

    if (this.invuln > 0) this.invuln -= dt
    this.fireCd = Math.max(0, this.fireCd - dt)

    if (this.input.fire() && this.fireCd <= 0) {
      const def = WEAPONS[this.weapon]
      this.fireCd = def.cooldown / (1 + this.levelIndex * 0.05)
      const { ax, ay } = this.aimVector()
      const muzzleY = this.py + (this.ducking ? 0.45 : this.aimingUp && Math.abs(ax) < 0.1 ? 1.7 : 1.15)
      const muzzleX = this.px + ax * 0.55
      const shots = fireWeapon(this.weapon, muzzleX, muzzleY, ax, ay)
      for (const s of shots) {
        const mesh = createBulletMesh(hexToInt(s.color), !!s.flame)
        this.root.add(mesh)
        s.mesh = mesh
        this.bullets.push(s)
      }
      this.sfx.shoot(this.weapon)
      this.muzzleLight.color.setHex(hexToInt(def.color))
      this.muzzleLight.intensity = 6
    }
    this.muzzleLight.intensity = lerp(this.muzzleLight.intensity, 0, 1 - Math.pow(0.0001, dt))
  }

  updateSpawns(dt: number) {
    if (this.bossSpawned) return
    const prog = this.camX + 8

    if (!this.midSpawned && prog >= this.midAt()) {
      this.spawnMidBoss()
      return
    }
    if (this.midSpawned && !this.bossSpawned && prog >= this.bossAt()) {
      if (!this.enemies.some((e) => e.kind === 'midboss' && !e.dead)) this.spawnBoss()
      return
    }
    if (this.enemies.some((e) => (e.kind === 'midboss' || e.kind === 'boss') && !e.dead)) return

    this.spawnTimer -= dt
    if (this.spawnTimer > 0) return
    this.spawnTimer = this.level.enemyRate * rand(0.7, 1.15)
    const kinds: Enemy['kind'][] = ['grunt', 'grunt', 'flyer', 'heavy']
    const kind = kinds[Math.floor(Math.random() * kinds.length)]!
    const x = this.camX + 16 + rand(0, 3)
    if (kind === 'flyer') this.spawnEnemy(kind, x, 2.5 + rand(0, 2))
    else this.spawnEnemy(kind, x, 0)
  }

  spawnEnemy(kind: Enemy['kind'], x: number, y: number, overrides: Partial<Enemy> = {}) {
    const d = this.level.difficulty
    const base: Record<string, Partial<Enemy>> = {
      grunt: { w: 0.7, h: 1.5, hp: 28 * d, vx: -2.2 },
      flyer: { w: 0.9, h: 0.6, hp: 22 * d, vx: -3.2 },
      heavy: { w: 1.1, h: 1.6, hp: 70 * d, vx: -1.4 },
    }
    const b = base[kind] || { w: 0.8, h: 1.2, hp: 40, vx: -2 }
    let mesh: THREE.Object3D
    if (kind === 'grunt') mesh = createGrunt()
    else if (kind === 'flyer') mesh = createFlyer()
    else if (kind === 'heavy') mesh = createHeavy()
    else if (kind === 'midboss') mesh = createMidBoss(hexToInt(this.level.accent))
    else mesh = createBoss(hexToInt(this.level.accent))

    const e: Enemy = {
      id: Math.random().toString(36).slice(2),
      x, y,
      w: b.w!, h: b.h!,
      hp: overrides.hp ?? b.hp!,
      maxHp: overrides.hp ?? b.hp!,
      vx: b.vx!,
      kind,
      t: 0,
      fireCd: rand(0.4, 1.2),
      facing: -1,
      mesh,
      ...overrides,
    }
    e.maxHp = e.hp
    this.root.add(mesh)
    this.enemies.push(e)
  }

  spawnMidBoss() {
    this.midSpawned = true
    this.spawnEnemy('midboss', this.camX + 11, 0, {
      w: 2.4, h: 2.2,
      hp: this.level.midBossHp,
      name: this.level.midBossName,
      phase: 0,
      vx: -0.4,
    })
    this.banner(this.level.midBossName)
    this.shake = 1.2
  }

  spawnBoss() {
    this.bossSpawned = true
    this.spawnEnemy('boss', this.camX + 10, 0, {
      w: 3.2, h: 3.2,
      hp: this.level.bossHp,
      name: this.level.bossName,
      phase: 0,
      vx: -0.2,
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
        e.y = 2.2 + Math.sin(e.t * 3) * 0.8
      } else if (e.kind === 'grunt' || e.kind === 'heavy') {
        e.x += e.vx * dt
        e.y = 0
      } else {
        const targetX = this.camX + 9 + Math.sin(e.t * 0.7) * 0.8
        e.x = lerp(e.x, targetX, 1 - Math.pow(0.02, dt))
        e.y = e.kind === 'boss' ? 0.2 + Math.sin(e.t * 1.2) * 0.15 : 0
        const ratio = e.hp / e.maxHp
        e.phase = ratio < 0.35 ? 2 : ratio < 0.7 ? 1 : 0
        if (e.mesh) e.mesh.rotation.y = e.t * (e.kind === 'boss' ? 0.8 : 0.4)
      }

      if (e.fireCd <= 0 && e.x - this.camX < 18) this.enemyFire(e)

      const hb = this.playerHitbox()
      if (this.invuln <= 0 && aabb(hb, { x: e.x - e.w / 2, y: e.y, w: e.w, h: e.h })) {
        this.hurt(e.kind === 'boss' ? 28 : e.kind === 'midboss' ? 20 : 14)
      }

      if (e.x < this.camX - 6) {
        if (e.mesh) this.root.remove(e.mesh)
        continue
      }
      next.push(e)
    }
    this.enemies = next
  }

  enemyFire(e: Enemy) {
    const dx = this.px - e.x
    const chestY = this.py + 1.25
    const dy = chestY - (e.y + e.h * 0.45)
    const len = Math.hypot(dx, dy) || 1
    const d = this.level.difficulty

    const shoot = (vx: number, vy: number, damage: number, radius: number, color: string, life = 2.5, by = 1.25) => {
      const mesh = createBulletMesh(hexToInt(color))
      this.root.add(mesh)
      this.bullets.push({
        x: e.x - 0.5, y: by,
        vx, vy, life, damage, radius, fromPlayer: false, weapon: 'pulse', color, mesh,
      })
    }

    if (e.kind === 'grunt') {
      e.fireCd = 1.35 / d
      // Flat chest-height — duck (hitbox top 0.72) and it sails over
      shoot(-8.2, 0, 10, 0.16, '#ff6b6b', 2.5, 1.25)
    } else if (e.kind === 'flyer') {
      e.fireCd = 1.05 / d
      shoot((dx / len) * 9, (dy / len) * 9, 8, 0.14, '#ff9f43', 2.2, e.y)
    } else if (e.kind === 'heavy') {
      e.fireCd = 1.7 / d
      shoot(-6.8, 0.6, 14, 0.18, '#ff4757', 2.5, 1.55)
      shoot(-6.8, 0, 14, 0.18, '#ff4757', 2.5, 1.2)
      shoot(-6.8, -0.5, 14, 0.18, '#ff4757', 2.5, 0.55)
    } else if (e.kind === 'midboss') {
      const phase = e.phase || 0
      e.fireCd = (phase === 2 ? 0.35 : phase === 1 ? 0.55 : 0.8) / Math.sqrt(d)
      const n = 3 + phase * 2
      for (let i = 0; i < n; i++) {
        const a = Math.atan2(dy, dx) + (i - (n - 1) / 2) * 0.18
        shoot(Math.cos(a) * (7 + phase), Math.sin(a) * (7 + phase), 12, 0.18, this.level.accent, 3, e.y + 1.2)
      }
    } else if (e.kind === 'boss') {
      const phase = e.phase || 0
      e.fireCd = (phase === 2 ? 0.22 : phase === 1 ? 0.38 : 0.55) / Math.sqrt(d)
      const n = 8 + phase * 4
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + e.t
        shoot(Math.cos(a) * (5 + phase * 1.2), Math.sin(a) * (5 + phase * 1.2), 14, 0.2, '#ff3d5a', 3.5, e.y + 1.6)
      }
      if (phase >= 1) {
        for (let i = -2; i <= 2; i++) {
          const a = Math.atan2(chestY - (e.y + 1.6), dx) + i * 0.12
          shoot(Math.cos(a) * 10, Math.sin(a) * 10, 16, 0.16, '#ffe66d', 2.8, e.y + 1.6)
        }
      }
      if (this.levelIndex === 2 && phase === 2 && Math.random() < 0.4) {
        for (let i = 0; i < 5; i++) {
          const bx = this.camX + rand(2, 14)
          const mesh = createBulletMesh(0xff9ff3)
          this.root.add(mesh)
          this.bullets.push({
            x: bx, y: 10, vx: rand(-1, 1), vy: -rand(5, 8),
            life: 4, damage: 18, radius: 0.22, fromPlayer: false, weapon: 'pulse', color: '#ff9ff3', mesh,
          })
        }
      }
    }
  }

  updateBullets(dt: number) {
    const next: Bullet[] = []
    for (const b of this.bullets) {
      b.life -= dt
      if (b.life <= 0) {
        if (b.mesh) this.root.remove(b.mesh)
        continue
      }

      if (b.homing && b.fromPlayer) {
        let best: Enemy | null = null
        let bestD = 999
        for (const e of this.enemies) {
          if (e.dead) continue
          const dist = Math.hypot(e.x - b.x, e.y + e.h / 2 - b.y)
          if (dist < bestD) { bestD = dist; best = e }
        }
        if (best) {
          const dx = best.x - b.x
          const dy = best.y + best.h / 2 - b.y
          const len = Math.hypot(dx, dy) || 1
          b.vx = lerp(b.vx, (dx / len) * 14, 1 - Math.pow(0.05, dt))
          b.vy = lerp(b.vy, (dy / len) * 14, 1 - Math.pow(0.05, dt))
        }
      }

      b.x += b.vx * dt
      b.y += b.vy * dt

      if (b.fromPlayer) {
        let hit = false
        for (const e of this.enemies) {
          if (e.dead) continue
          if (Math.hypot(b.x - e.x, b.y - (e.y + e.h / 2)) < b.radius + e.w * 0.35) {
            e.hp -= b.damage
            this.fx.explode(b.x, b.y, hexToInt(b.color), 8, 5)
            if (e.hp <= 0) this.killEnemy(e)
            if (b.pierce && b.pierce > 0) b.pierce--
            else hit = true
            if (hit) break
          }
        }
        if (hit) {
          if (b.mesh) this.root.remove(b.mesh)
          continue
        }
      } else if (this.invuln <= 0) {
        const hb = this.playerHitbox()
        const cx = clamp(b.x, hb.x, hb.x + hb.w)
        const cy = clamp(b.y, hb.y, hb.y + hb.h)
        if (Math.hypot(b.x - cx, b.y - cy) < b.radius) {
          this.hurt(b.damage)
          this.fx.explode(b.x, b.y, 0xffffff, 10, 5)
          if (b.mesh) this.root.remove(b.mesh)
          continue
        }
      }

      if (b.x < this.camX - 4 || b.x > this.camX + 22 || b.y < -2 || b.y > 14) {
        if (b.mesh) this.root.remove(b.mesh)
        continue
      }
      next.push(b)
    }
    this.bullets = next
  }

  killEnemy(e: Enemy) {
    e.dead = true
    e.hp = 0
    this.sfx.boom()
    this.fx.explode(e.x, e.y + e.h / 2, hexToInt(this.level.accent), 36, 10)
    this.shake = Math.max(this.shake, e.kind === 'boss' ? 1.6 : e.kind === 'midboss' ? 1.1 : 0.35)
    this.score += e.kind === 'boss' ? 5000 : e.kind === 'midboss' ? 2000 : e.kind === 'heavy' ? 300 : e.kind === 'flyer' ? 200 : 100
    if (e.mesh) this.root.remove(e.mesh)

    if (e.kind === 'midboss' || e.kind === 'boss' || Math.random() < 0.2) {
      const weapon = e.kind === 'boss'
        ? (['railstorm', 'swarm', 'inferno'] as WeaponId[])[this.levelIndex]!
        : e.kind === 'midboss'
          ? (['hyperspread', 'plasma', 'swarm'] as WeaponId[])[this.levelIndex]!
          : DROP_TABLE[Math.floor(Math.random() * DROP_TABLE.length)]!
      const mesh = createPickupMesh(hexToInt(WEAPONS[weapon].color))
      this.root.add(mesh)
      this.pickups.push({ x: e.x, y: e.y + 0.8, weapon, life: 14, bob: 0, mesh })
    }
  }

  updatePickups(dt: number) {
    const next: Pickup[] = []
    for (const p of this.pickups) {
      p.life -= dt
      p.bob += dt * 4
      if (p.life <= 0) {
        if (p.mesh) this.root.remove(p.mesh)
        continue
      }
      if (Math.hypot(p.x - this.px, p.y - (this.py + 0.8)) < 1.0) {
        this.weapon = p.weapon
        this.sfx.pickup()
        this.fx.explode(p.x, p.y, hexToInt(WEAPONS[p.weapon].color), 18, 6)
        if (p.mesh) this.root.remove(p.mesh)
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
        this.px = this.camX + 3
        this.py = 2
        this.pvy = 0
        this.invuln = 2
        this.weapon = 'pulse'
      }
    }
  }

  syncMeshes() {
    this.playerMesh.position.set(this.px, this.py, 0)
    this.playerMesh.scale.x = this.facing
    this.playerMesh.scale.y = this.ducking ? 0.55 : 1
    this.playerMesh.visible = !(this.invuln > 0 && Math.floor(this.t * 20) % 2 === 0)

    const gun = this.playerMesh.userData.gun as THREE.Object3D | undefined
    if (gun) {
      const { ax, ay } = this.aimVector()
      gun.rotation.z = Math.atan2(ay, ax * this.facing)
      gun.position.y = this.ducking ? 0.55 : 1.05
    }

    for (const e of this.enemies) {
      if (!e.mesh || e.dead) continue
      e.mesh.position.set(e.x, e.y, 0)
    }
    for (const b of this.bullets) {
      if (!b.mesh) continue
      b.mesh.position.set(b.x, b.y, 0)
      if (!b.flame) b.mesh.rotation.z = Math.atan2(b.vy, b.vx)
    }
    for (const p of this.pickups) {
      if (!p.mesh) continue
      p.mesh.position.set(p.x, p.y + Math.sin(p.bob) * 0.15, 0)
      p.mesh.rotation.y = this.t * 2
    }
  }

  draw() {
    const sx = (Math.random() - 0.5) * this.shake * 0.35
    const sy = (Math.random() - 0.5) * this.shake * 0.25

    if (this.mode === 'play' || this.mode === 'bossbanner' || this.mode === 'clear') {
      this.camera.position.set(this.camX + 5 + sx, 3.4 + this.py * 0.08 + sy, 13.5)
      this.camera.lookAt(this.camX + 5, 2.2 + this.py * 0.05, 0)
      this.fill.position.x = this.camX + 4
      this.rim.position.x = this.camX + 6
      this.keyLight.position.x = this.camX + 8
    }

    this.composer.render()

    const boss = this.enemies.find((e) => (e.kind === 'boss' || e.kind === 'midboss') && !e.dead)
    let bar = this.el('bossBar')
    if (!bar) {
      bar = document.createElement('div')
      bar.id = 'bossBar'
      bar.innerHTML = '<div class="boss-name"></div><div class="boss-track"><i></i></div>'
      this.el('ui')?.appendChild(bar)
    }
    if (boss && (this.mode === 'play' || this.mode === 'bossbanner')) {
      bar.classList.remove('hidden')
      const name = bar.querySelector('.boss-name')
      const fill = bar.querySelector('i') as HTMLElement | null
      if (name) name.textContent = boss.name || 'THREAT'
      if (fill) fill.style.width = `${clamp(boss.hp / boss.maxHp, 0, 1) * 100}%`
    } else {
      bar.classList.add('hidden')
    }

    let ban = this.el('bossBanner')
    if (!ban) {
      ban = document.createElement('div')
      ban.id = 'bossBanner'
      this.el('ui')?.appendChild(ban)
    }
    if (this.mode === 'bossbanner') {
      ban.textContent = `⚠ ${this.bannerText}`
      ban.classList.remove('hidden')
    } else {
      ban.classList.add('hidden')
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
