import * as THREE from 'three'
import type { LevelTheme } from '../levels/themes'

export class WorldBuilder {
  group = new THREE.Group()

  build(level: LevelTheme, length: number) {
    while (this.group.children.length) {
      const c = this.group.children[0]!
      this.group.remove(c)
      c.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          const m = o as THREE.Mesh
          m.geometry?.dispose()
          const mat = m.material
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
          else (mat as THREE.Material)?.dispose()
        }
      })
    }

    const accent = parseInt(level.accent.replace('#', ''), 16)
    const groundCol = parseInt(level.ground.replace('#', ''), 16)

    // Ground strip
    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(length + 40, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: groundCol, metalness: 0.35, roughness: 0.7 }),
    )
    ground.position.set(length / 2, -0.6, 0)
    ground.receiveShadow = true
    this.group.add(ground)

    // Neon edge
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(length + 40, 0.08, 8.2),
      new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.4, metalness: 0.2, roughness: 0.3 }),
    )
    edge.position.set(length / 2, 0.02, 0)
    this.group.add(edge)

    // Back wall / canyon
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(length + 40, 18, 1),
      new THREE.MeshStandardMaterial({ color: 0x0a0c12, metalness: 0.5, roughness: 0.85 }),
    )
    wall.position.set(length / 2, 8, -4.2)
    this.group.add(wall)

    // Accent panels on wall
    for (let x = 8; x < length; x += 14) {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(3 + (x % 5), 2.2),
        new THREE.MeshStandardMaterial({
          color: accent,
          emissive: accent,
          emissiveIntensity: 0.55,
          transparent: true,
          opacity: 0.35,
        }),
      )
      panel.position.set(x, 3 + (x % 7) * 0.3, -3.65)
      this.group.add(panel)
    }

    // Silhouette props
    for (let x = 6; x < length - 10; x += 9 + (x % 5)) {
      if (level.id === 0) this.addTree(x, accent)
      else if (level.id === 1) this.addTower(x, accent)
      else this.addSpire(x, accent)
    }

    // Floating debris / energy motes
    for (let i = 0; i < 40; i++) {
      const mote = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.08, 6, 6),
        new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.55 }),
      )
      mote.position.set(Math.random() * length, 1 + Math.random() * 8, -1 + Math.random() * 2)
      mote.userData.bob = Math.random() * Math.PI * 2
      mote.userData.baseY = mote.position.y
      this.group.add(mote)
    }

    // Platforms
    this.platforms = [{ x: 0, y: 0, w: length + 20, h: 0.5 }]
    for (let x = 12; x < length - 15; x += 8 + Math.random() * 6) {
      const w = 2.5 + Math.random() * 2.5
      const y = 1.6 + Math.random() * 2.8
      const plat = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.25, 2.2),
        new THREE.MeshStandardMaterial({
          color: 0x1a1a28,
          emissive: accent,
          emissiveIntensity: 0.35,
          metalness: 0.6,
          roughness: 0.35,
        }),
      )
      plat.position.set(x + w / 2, y, 0)
      plat.castShadow = true
      plat.receiveShadow = true
      this.group.add(plat)
      this.platforms.push({ x, y: y + 0.12, w, h: 0.25 })
    }
  }

  platforms: { x: number; y: number; w: number; h: number }[] = []

  private addTree(x: number, accent: number) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.22, 3.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x1c2a1c, roughness: 0.9 }),
    )
    trunk.position.set(x, 1.6, -2.2)
    trunk.castShadow = true
    this.group.add(trunk)
    const canopy = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.1, 0),
      new THREE.MeshStandardMaterial({ color: 0x14532d, emissive: accent, emissiveIntensity: 0.15, roughness: 0.8 }),
    )
    canopy.position.set(x, 3.6, -2.2)
    this.group.add(canopy)
  }

  private addTower(x: number, accent: number) {
    const t = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 5.5, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x221828, metalness: 0.7, roughness: 0.4, emissive: accent, emissiveIntensity: 0.2 }),
    )
    t.position.set(x, 2.75, -2.4)
    t.castShadow = true
    this.group.add(t)
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.35, 1.6),
      new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.2 }),
    )
    top.position.set(x, 5.6, -2.4)
    this.group.add(top)
  }

  private addSpire(x: number, accent: number) {
    const s = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 7, 5),
      new THREE.MeshStandardMaterial({ color: 0x2a1010, emissive: accent, emissiveIntensity: 0.45, metalness: 0.5, roughness: 0.35 }),
    )
    s.position.set(x, 3.5, -2.5)
    s.castShadow = true
    this.group.add(s)
  }

  update(t: number) {
    for (const c of this.group.children) {
      if (c.userData.bob != null) {
        c.position.y = c.userData.baseY + Math.sin(t * 1.5 + c.userData.bob) * 0.25
      }
    }
  }
}
