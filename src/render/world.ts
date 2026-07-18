import * as THREE from 'three'
import type { LevelTheme } from '../levels/themes'
import { TEX, pbr } from './textures'

export class WorldBuilder {
  group = new THREE.Group()
  platforms: { x: number; y: number; w: number; h: number }[] = []

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

    const groundMap = level.id === 0 ? TEX.grass : level.id === 1 ? TEX.concrete : TEX.rock
    const groundColor = level.id === 0 ? 0x3d5a2e : level.id === 1 ? 0x5a5a58 : 0x4a3830

    // Main ground
    const groundMat = pbr(groundColor, { map: groundMap, metalness: 0.08, roughness: 0.92, repeat: length / 4 })
    if (groundMat.map) groundMat.map = groundMat.map.clone()
    if (groundMat.map) {
      groundMat.map.repeat.set(length / 3, 2)
      groundMat.map.needsUpdate = true
    }
    const ground = new THREE.Mesh(new THREE.BoxGeometry(length + 40, 1.4, 10), groundMat)
    ground.position.set(length / 2, -0.7, 0)
    ground.receiveShadow = true
    this.group.add(ground)

    // Dirt shoulder / cliff face
    const cliff = new THREE.Mesh(
      new THREE.BoxGeometry(length + 40, 14, 2.5),
      pbr(level.id === 2 ? 0x3a2820 : 0x4a4538, { map: TEX.rock, metalness: 0.1, roughness: 0.9 }),
    )
    cliff.position.set(length / 2, 5.5, -5.2)
    cliff.receiveShadow = true
    this.group.add(cliff)

    // Far ridge
    for (let x = 0; x < length; x += 7) {
      const h = 3 + Math.sin(x * 0.2) * 1.5 + (x % 5) * 0.3
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, h, 3),
        pbr(0x2a3228, { map: TEX.rock, metalness: 0.05, roughness: 0.95 }),
      )
      ridge.position.set(x, h * 0.35, -7.5)
      ridge.receiveShadow = true
      this.group.add(ridge)
    }

    // Props
    for (let x = 5; x < length - 8; x += 6 + (x % 4)) {
      if (level.id === 0) this.addRealisticTree(x, -2.4 + (x % 3) * 0.3)
      else if (level.id === 1) this.addBunker(x)
      else this.addRuin(x)
    }

    // Ground scatter rocks
    for (let i = 0; i < 35; i++) {
      const rx = 3 + Math.random() * (length - 6)
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.15 + Math.random() * 0.35, 0),
        pbr(0x6a655c, { map: TEX.rock, metalness: 0.05, roughness: 0.9 }),
      )
      rock.position.set(rx, 0.12, -1.2 + Math.random() * 2.5)
      rock.rotation.set(Math.random(), Math.random(), Math.random())
      rock.castShadow = true
      rock.receiveShadow = true
      this.group.add(rock)
    }

    // Platforms — weathered stone / metal
    this.platforms = [{ x: 0, y: 0, w: length + 20, h: 0.5 }]
    for (let x = 12; x < length - 15; x += 8 + Math.random() * 6) {
      const w = 2.5 + Math.random() * 2.5
      const y = 1.6 + Math.random() * 2.8
      const plat = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.28, 2.4),
        pbr(level.id === 1 ? 0x55565a : 0x5a5348, {
          map: level.id === 1 ? TEX.metal : TEX.rock,
          metalness: level.id === 1 ? 0.55 : 0.1,
          roughness: level.id === 1 ? 0.45 : 0.85,
        }),
      )
      plat.position.set(x + w / 2, y, 0)
      plat.castShadow = true
      plat.receiveShadow = true
      this.group.add(plat)
      this.platforms.push({ x, y: y + 0.14, w, h: 0.28 })
    }
  }

  private addRealisticTree(x: number, z: number) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.2, 2.8, 8),
      pbr(0x5a3a22, { map: TEX.bark, metalness: 0.02, roughness: 0.92 }),
    )
    trunk.position.set(x, 1.4, z)
    trunk.castShadow = true
    this.group.add(trunk)

    const leafMat = pbr(0x2f6b2a, { map: TEX.grass, metalness: 0.02, roughness: 0.85 })
    for (let i = 0; i < 4; i++) {
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.7 + Math.random() * 0.35, 10, 8), leafMat)
      canopy.position.set(
        x + (Math.random() - 0.5) * 0.5,
        2.8 + i * 0.35,
        z + (Math.random() - 0.5) * 0.4,
      )
      canopy.scale.y = 0.75
      canopy.castShadow = true
      this.group.add(canopy)
    }
  }

  private addBunker(x: number) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.4, 1.8),
      pbr(0x6a6a66, { map: TEX.concrete, metalness: 0.15, roughness: 0.88 }),
    )
    wall.position.set(x, 1.2, -2.6)
    wall.castShadow = true
    wall.receiveShadow = true
    this.group.add(wall)
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.25, 2.1),
      pbr(0x4a4a48, { map: TEX.metal, metalness: 0.5, roughness: 0.5 }),
    )
    roof.position.set(x, 2.5, -2.6)
    roof.castShadow = true
    this.group.add(roof)
    const vent = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8),
      pbr(0x333, { metalness: 0.7, roughness: 0.4 }),
    )
    vent.position.set(x + 0.6, 2.85, -2.6)
    this.group.add(vent)
  }

  private addRuin(x: number) {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 4.5, 0.7),
      pbr(0x4a3830, { map: TEX.rock, metalness: 0.1, roughness: 0.9 }),
    )
    pillar.position.set(x, 2.2, -2.8)
    pillar.castShadow = true
    this.group.add(pillar)
    const broken = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.4, 0.7),
      pbr(0x3a2820, { map: TEX.rock, metalness: 0.1, roughness: 0.9 }),
    )
    broken.position.set(x + 0.4, 4.2, -2.8)
    broken.rotation.z = 0.35
    broken.castShadow = true
    this.group.add(broken)
  }

  update(_t: number) {
    // static world — no neon motes
  }
}
