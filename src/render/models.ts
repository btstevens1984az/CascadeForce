import * as THREE from 'three'

function mat(color: number, emissive = 0, intensity = 0.6, metalness = 0.55, roughness = 0.35) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    metalness,
    roughness,
  })
}

export function createSoldier(): THREE.Group {
  const g = new THREE.Group()
  const armor = mat(0xd8e7ff, 0x39e6ff, 0.25, 0.7, 0.28)
  const accent = mat(0x1a2438, 0x39e6ff, 0.8, 0.4, 0.4)
  const glow = mat(0xff5ad5, 0xff5ad5, 1.2, 0.2, 0.35)

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 6, 12), armor)
  torso.position.y = 0.95
  torso.castShadow = true
  g.add(torso)

  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), accent)
  helm.position.y = 1.55
  helm.scale.set(1, 0.9, 1.05)
  helm.castShadow = true
  g.add(helm)

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.12), mat(0x39e6ff, 0x39e6ff, 2.5, 0.1, 0.1))
  visor.position.set(0, 1.55, 0.18)
  g.add(visor)

  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.2), mat(0x2a3348, 0x39e6ff, 0.4))
  pack.position.set(0, 1.0, -0.28)
  g.add(pack)

  for (const sx of [-0.18, 0.18]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.35, 4, 8), armor)
    leg.position.set(sx, 0.35, 0)
    leg.castShadow = true
    g.add(leg)
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.28), glow)
    boot.position.set(sx, 0.08, 0.04)
    g.add(boot)
  }

  const gun = new THREE.Group()
  gun.name = 'gun'
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.7, 8), mat(0x8899aa, 0x9dffc2, 0.5))
  barrel.rotation.z = Math.PI / 2
  barrel.position.set(0.45, 0, 0.15)
  gun.add(barrel)
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.1), mat(0x334455, 0x39e6ff, 0.3))
  stock.position.set(0.1, 0, 0.15)
  gun.add(stock)
  gun.position.set(0.15, 1.05, 0.1)
  g.add(gun)

  g.userData.gun = gun
  g.userData.torso = torso
  return g
}

export function createGrunt(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.5, 4, 10), mat(0x8b2a2a, 0xff3d5a, 0.35))
  body.position.y = 0.85
  body.castShadow = true
  g.add(body)
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.35), mat(0x2a1010, 0xff6b6b, 0.5))
  head.position.y = 1.4
  g.add(head)
  return g
}

export function createFlyer(): THREE.Group {
  const g = new THREE.Group()
  const core = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 6), mat(0xe67e22, 0xff9f43, 0.7))
  core.rotation.z = Math.PI / 2
  core.castShadow = true
  g.add(core)
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.7), mat(0xff9f43, 0xff9f43, 1.0))
  wingL.position.set(0, 0.1, 0.35)
  g.add(wingL)
  const wingR = wingL.clone()
  wingR.position.z = -0.35
  g.add(wingR)
  return g
}

export function createHeavy(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.7), mat(0x7f8c8d, 0xe74c3c, 0.4, 0.85, 0.25))
  body.position.y = 0.7
  body.castShadow = true
  g.add(body)
  const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.8, 8), mat(0x333, 0xff4757, 0.8))
  gun.rotation.z = Math.PI / 2
  gun.position.set(0.55, 0.85, 0)
  g.add(gun)
  return g
}

export function createMidBoss(accent: number): THREE.Group {
  const g = new THREE.Group()
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 1.4), mat(0x2c3e50, accent, 0.55, 0.8, 0.3))
  chassis.position.y = 1.0
  chassis.castShadow = true
  g.add(chassis)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), mat(accent, accent, 1.8, 0.2, 0.15))
  dome.position.y = 1.85
  g.add(dome)
  for (const sx of [-1.3, 1.3]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 1.2), mat(0x1a1a22, accent, 0.4))
    leg.position.set(sx, 0.35, 0)
    g.add(leg)
  }
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat(0xffffff, accent, 3))
  eye.position.set(0.9, 1.2, 0.55)
  g.add(eye)
  return g
}

export function createBoss(accent: number): THREE.Group {
  const g = new THREE.Group()
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), mat(0x1a0a0a, accent, 0.9, 0.3, 0.2))
  core.position.y = 1.6
  core.castShadow = true
  g.add(core)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.12, 8, 40), mat(accent, accent, 2.2, 0.2, 0.2))
  ring.rotation.x = Math.PI / 2
  ring.position.y = 1.6
  g.add(ring)
  const ring2 = ring.clone()
  ring2.scale.set(0.7, 0.7, 0.7)
  ring2.rotation.z = 0.6
  g.add(ring2)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.2, 5), mat(accent, accent, 1.4))
    claw.position.set(Math.cos(a) * 1.6, 1.2, Math.sin(a) * 1.0)
    claw.lookAt(0, 1.6, 0)
    g.add(claw)
  }
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), mat(0xffe66d, 0xffe66d, 3.5, 0.1, 0.1))
  heart.position.y = 1.6
  g.add(heart)
  g.userData.core = core
  g.userData.ring = ring
  g.userData.heart = heart
  return g
}

export function createPickupMesh(color: number): THREE.Group {
  const g = new THREE.Group()
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), mat(color, color, 1.6, 0.3, 0.25))
  g.add(box)
  const aura = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.25,
  }))
  g.add(aura)
  return g
}

export function createBulletMesh(color: number, flame = false): THREE.Mesh {
  const geo = flame
    ? new THREE.SphereGeometry(0.28, 8, 8)
    : new THREE.CapsuleGeometry(0.08, 0.35, 4, 8)
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: flame ? 0.75 : 1 })
  const mesh = new THREE.Mesh(geo, m)
  if (!flame) mesh.rotation.z = Math.PI / 2
  return mesh
}

export function createMuzzleFlash(color: number): THREE.PointLight {
  return new THREE.PointLight(color, 4, 6, 2)
}
