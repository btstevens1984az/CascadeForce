import * as THREE from 'three'
import { TEX, pbr, } from './textures'

function shadow(m: THREE.Mesh) {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Tactical operative — muted military kit, not neon. */
export function createSoldier(): THREE.Group {
  const g = new THREE.Group()
  const fatigues = pbr(0x4a5c3a, { map: TEX.grass, metalness: 0.05, roughness: 0.88 })
  const armor = pbr(0x3a3f38, { map: TEX.metal, metalness: 0.55, roughness: 0.45 })
  const skin = pbr(0xc4a484, { metalness: 0.05, roughness: 0.7 })
  const gunMetal = pbr(0x2a2e32, { map: TEX.metal, metalness: 0.85, roughness: 0.35 })

  const hips = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.28), fatigues))
  hips.position.y = 0.72
  g.add(hips)

  const torso = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.55, 0.32), armor))
  torso.position.y = 1.1
  g.add(torso)

  const vest = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.34), pbr(0x2f352c, { metalness: 0.2, roughness: 0.8 })))
  vest.position.y = 1.15
  g.add(vest)

  const head = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), skin))
  head.position.y = 1.55
  g.add(head)

  const helm = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.175, 16, 12), pbr(0x2c3328, { metalness: 0.4, roughness: 0.5 })))
  helm.scale.set(1.05, 0.75, 1.1)
  helm.position.y = 1.62
  g.add(helm)

  const visor = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.08), pbr(0x1a2228, { metalness: 0.9, roughness: 0.15 })))
  visor.position.set(0, 1.55, 0.14)
  g.add(visor)

  for (const sx of [-0.14, 0.14]) {
    const thigh = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.28, 4, 8), fatigues))
    thigh.position.set(sx, 0.48, 0)
    g.add(thigh)
    const boot = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.26), pbr(0x1a1a18, { metalness: 0.1, roughness: 0.7 })))
    boot.position.set(sx, 0.08, 0.04)
    g.add(boot)
  }

  for (const sx of [-0.28, 0.28]) {
    const arm = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.28, 4, 8), fatigues))
    arm.position.set(sx, 1.05, 0)
    g.add(arm)
  }

  const gun = new THREE.Group()
  gun.name = 'gun'
  const receiver = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.1), gunMetal))
  receiver.position.set(0.25, 0, 0.12)
  gun.add(receiver)
  const barrel = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.55, 10), gunMetal))
  barrel.rotation.z = Math.PI / 2
  barrel.position.set(0.55, 0.02, 0.12)
  gun.add(barrel)
  const stock = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.08), pbr(0x1e221c, { metalness: 0.2, roughness: 0.7 })))
  stock.position.set(0.02, -0.02, 0.12)
  gun.add(stock)
  const mag = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.08), gunMetal))
  mag.position.set(0.28, -0.1, 0.12)
  gun.add(mag)
  gun.position.set(0.2, 1.05, 0.05)
  g.add(gun)

  g.userData.gun = gun
  g.userData.torso = torso
  return g
}

export function createGrunt(): THREE.Group {
  const g = new THREE.Group()
  const suit = pbr(0x5c4030, { map: TEX.dirt, metalness: 0.15, roughness: 0.85 })
  const armor = pbr(0x4a3020, { map: TEX.metal, metalness: 0.45, roughness: 0.55 })

  const body = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.45, 6, 12), suit))
  body.position.y = 0.9
  g.add(body)
  const chest = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.32), armor))
  chest.position.y = 1.05
  g.add(chest)
  const head = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), pbr(0xb8956c, { roughness: 0.7 })))
  head.position.y = 1.45
  g.add(head)
  const mask = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.12), pbr(0x2a2018, { metalness: 0.6, roughness: 0.4 })))
  mask.position.set(0, 1.42, 0.12)
  g.add(mask)
  const rifle = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.08), pbr(0x333, { metalness: 0.8, roughness: 0.35 })))
  rifle.position.set(0.35, 0.95, 0.15)
  g.add(rifle)
  return g
}

export function createFlyer(): THREE.Group {
  const g = new THREE.Group()
  const hull = pbr(0x6a6e72, { map: TEX.metal, metalness: 0.75, roughness: 0.35 })
  const core = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), hull))
  g.add(core)
  const nose = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 8), hull))
  nose.rotation.z = -Math.PI / 2
  nose.position.x = 0.4
  g.add(nose)
  for (const z of [-0.45, 0.45]) {
    const wing = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.55), pbr(0x4a4e52, { metalness: 0.7, roughness: 0.4 })))
    wing.position.set(0, 0, z)
    g.add(wing)
  }
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff6622, emissive: 0xff4400, emissiveIntensity: 1.2, metalness: 0.2, roughness: 0.4 }),
  )
  glow.position.x = -0.25
  g.add(glow)
  return g
}

export function createHeavy(): THREE.Group {
  const g = new THREE.Group()
  const plate = pbr(0x5a5e62, { map: TEX.metal, metalness: 0.8, roughness: 0.32 })
  const body = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.15, 0.7), plate))
  body.position.y = 0.75
  g.add(body)
  const shoulder = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.25, 0.5), plate))
  shoulder.position.y = 1.35
  g.add(shoulder)
  const gun = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.85, 10), pbr(0x2a2a2a, { metalness: 0.85, roughness: 0.3 })))
  gun.rotation.z = Math.PI / 2
  gun.position.set(0.65, 0.95, 0)
  g.add(gun)
  const optic = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.12), pbr(0x111, { metalness: 0.5, roughness: 0.2, emissive: 0x440000, emissiveIntensity: 0.4 })))
  optic.position.set(0.2, 1.2, 0.3)
  g.add(optic)
  return g
}

export function createMidBoss(_accent: number): THREE.Group {
  const g = new THREE.Group()
  const armor = pbr(0x3d4540, { map: TEX.metal, metalness: 0.7, roughness: 0.4 })
  const chassis = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 1.5), armor))
  chassis.position.y = 1.05
  g.add(chassis)
  const cab = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.2), pbr(0x2a3028, { metalness: 0.6, roughness: 0.45 })))
  cab.position.set(-0.3, 1.9, 0)
  g.add(cab)
  const glass = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.08), pbr(0x88aacc, { metalness: 0.9, roughness: 0.1 })))
  glass.position.set(-0.3, 1.95, 0.62)
  g.add(glass)
  for (const sx of [-1.1, 1.1]) {
    const track = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 1.6), pbr(0x222, { metalness: 0.5, roughness: 0.6 })))
    track.position.set(sx, 0.35, 0)
    g.add(track)
  }
  const cannon = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.4, 12), pbr(0x333, { metalness: 0.85, roughness: 0.3 })))
  cannon.rotation.z = Math.PI / 2
  cannon.position.set(1.4, 1.35, 0)
  g.add(cannon)
  return g
}

export function createBoss(_accent: number): THREE.Group {
  const g = new THREE.Group()
  const hull = pbr(0x2a2420, { map: TEX.metal, metalness: 0.75, roughness: 0.35 })
  const core = shadow(new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 18), hull))
  core.position.y = 1.7
  g.add(core)
  const collar = shadow(new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.14, 10, 40), pbr(0x4a4038, { metalness: 0.8, roughness: 0.3 })))
  collar.rotation.x = Math.PI / 2
  collar.position.y = 1.7
  g.add(collar)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    const arm = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 1.4), hull))
    arm.position.set(Math.cos(a) * 1.5, 1.4, Math.sin(a) * 0.9)
    arm.lookAt(0, 1.7, 0)
    g.add(arm)
  }
  const reactor = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0xff6600, emissiveIntensity: 1.5, metalness: 0.3, roughness: 0.25 }),
  )
  reactor.position.y = 1.7
  g.add(reactor)
  g.userData.core = core
  g.userData.heart = reactor
  return g
}

export function createPickupMesh(color: number): THREE.Group {
  const g = new THREE.Group()
  const crate = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), pbr(0x6b5428, { map: TEX.bark, metalness: 0.1, roughness: 0.8 })))
  g.add(crate)
  const stripe = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.56), new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.55, metalness: 0.3, roughness: 0.4,
  })))
  stripe.position.y = 0.05
  g.add(stripe)
  return g
}

export function createBulletMesh(color: number, flame = false): THREE.Mesh {
  if (flame) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 0xff6622,
        emissive: 0xff4400,
        emissiveIntensity: 1.4,
        transparent: true,
        opacity: 0.85,
        roughness: 0.4,
      }),
    )
  }
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.05, 0.28, 4, 8),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.9,
      metalness: 0.4,
      roughness: 0.3,
    }),
  )
  mesh.rotation.z = Math.PI / 2
  return mesh
}
