import * as THREE from 'three'
import { TEX, pbr } from './textures'

function shadow(m: THREE.Mesh) {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

type HumanKit = {
  skin: number
  shirt: number
  pants: number
  armor: number
  boot: number
  hair: number
  helmet?: boolean
  mask?: boolean
  enemyTint?: boolean
}

function addHumanoid(root: THREE.Group, kit: HumanKit, scale = 1) {
  const skin = pbr(kit.skin, { metalness: 0.02, roughness: 0.62 })
  const shirt = pbr(kit.shirt, { map: TEX.grass, metalness: 0.05, roughness: 0.82 })
  const pants = pbr(kit.pants, { map: TEX.dirt, metalness: 0.05, roughness: 0.85 })
  const armor = pbr(kit.armor, { map: TEX.metal, metalness: 0.45, roughness: 0.48 })
  const boot = pbr(kit.boot, { metalness: 0.15, roughness: 0.7 })
  const hairMat = pbr(kit.hair, { metalness: 0.05, roughness: 0.75 })

  const body = new THREE.Group()
  body.scale.setScalar(scale)
  root.add(body)

  // --- Legs (hip → foot) ---
  for (const side of [-1, 1] as const) {
    const hipX = side * 0.11
    const thigh = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.32, 5, 10), pants))
    thigh.position.set(hipX, 0.55, 0)
    body.add(thigh)

    const shin = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.3, 5, 10), pants))
    shin.position.set(hipX, 0.28, 0.02)
    body.add(shin)

    const foot = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), boot))
    foot.position.set(hipX, 0.05, 0.05)
    body.add(foot)

    // knee pad
    const knee = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), armor))
    knee.position.set(hipX, 0.4, 0.06)
    body.add(knee)
  }

  // hips / belt
  const hips = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.18, 12), pants))
  hips.position.y = 0.78
  body.add(hips)
  const belt = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.03, 6, 16), armor))
  belt.rotation.x = Math.PI / 2
  belt.position.y = 0.86
  body.add(belt)

  // torso
  const abdomen = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.22, 5, 12), shirt))
  abdomen.position.y = 1.05
  body.add(abdomen)

  const chest = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.26), armor))
  chest.position.y = 1.28
  body.add(chest)

  // vest straps / pouches for readability
  const pouch = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.08), pbr(0x2a2e28, { metalness: 0.2, roughness: 0.7 })))
  pouch.position.set(0.14, 1.18, 0.16)
  body.add(pouch)
  const pouch2 = pouch.clone()
  pouch2.position.x = -0.14
  body.add(pouch2)

  // neck
  const neck = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10), skin))
  neck.position.y = 1.52
  body.add(neck)

  // head — slightly oval, human proportions
  const head = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.135, 18, 14), skin))
  head.scale.set(0.95, 1.08, 0.92)
  head.position.y = 1.68
  body.add(head)

  // ears
  for (const side of [-1, 1] as const) {
    const ear = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), skin))
    ear.scale.set(0.5, 1, 0.7)
    ear.position.set(side * 0.13, 1.68, 0)
    body.add(ear)
  }

  // face: eyes, brows, nose, mouth
  const eyeWhite = pbr(0xf2f2f0, { metalness: 0.05, roughness: 0.4 })
  const iris = pbr(kit.enemyTint ? 0x5a2020 : 0x2a3a4a, { metalness: 0.1, roughness: 0.35 })
  for (const side of [-1, 1] as const) {
    const white = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), eyeWhite))
    white.position.set(side * 0.045, 1.7, 0.11)
    body.add(white)
    const pupil = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), iris))
    pupil.position.set(side * 0.045, 1.7, 0.13)
    body.add(pupil)
    const brow = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.02), hairMat))
    brow.position.set(side * 0.045, 1.735, 0.12)
    brow.rotation.z = side * -0.15
    body.add(brow)
  }

  const nose = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 6), skin))
  nose.rotation.x = Math.PI / 2
  nose.position.set(0, 1.665, 0.13)
  body.add(nose)

  const mouth = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.015), pbr(0x8a4a4a, { roughness: 0.6 })))
  mouth.position.set(0, 1.615, 0.12)
  body.add(mouth)

  // hair or helmet
  if (kit.helmet) {
    const helm = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), armor))
    helm.scale.set(1.05, 0.72, 1.1)
    helm.position.y = 1.74
    body.add(helm)
    const brim = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.18), armor))
    brim.position.set(0, 1.66, 0.08)
    body.add(brim)
  } else {
    const hair = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), hairMat))
    hair.scale.set(1.05, 0.7, 1.1)
    hair.position.set(0, 1.76, -0.02)
    body.add(hair)
  }

  if (kit.mask) {
    const mask = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.08), pbr(0x1a1e1a, { metalness: 0.5, roughness: 0.4 })))
    mask.position.set(0, 1.64, 0.12)
    body.add(mask)
  }

  // arms
  for (const side of [-1, 1] as const) {
    const shoulder = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), armor))
    shoulder.position.set(side * 0.26, 1.38, 0)
    body.add(shoulder)

    const upper = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.22, 4, 8), shirt))
    upper.position.set(side * 0.3, 1.18, 0.02)
    upper.rotation.z = side * 0.15
    body.add(upper)

    const forearm = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.2, 4, 8), shirt))
    forearm.position.set(side * 0.34, 0.95, 0.08)
    forearm.rotation.z = side * 0.25
    body.add(forearm)

    const hand = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), skin))
    hand.position.set(side * 0.36, 0.82, 0.12)
    body.add(hand)
  }

  return body
}

function makeRifle(): THREE.Group {
  const gun = new THREE.Group()
  gun.name = 'gun'
  const gunMetal = pbr(0x2a2e32, { map: TEX.metal, metalness: 0.85, roughness: 0.35 })
  const wood = pbr(0x3a2a1a, { metalness: 0.1, roughness: 0.75 })

  const receiver = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.11, 0.09), gunMetal))
  receiver.position.set(0.22, 0, 0)
  gun.add(receiver)
  const barrel = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.5, 10), gunMetal))
  barrel.rotation.z = Math.PI / 2
  barrel.position.set(0.52, 0.02, 0)
  gun.add(barrel)
  const stock = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.07), wood))
  stock.position.set(0.0, -0.01, 0)
  gun.add(stock)
  const grip = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), gunMetal))
  grip.position.set(0.12, -0.08, 0)
  gun.add(grip)
  const mag = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.07), gunMetal))
  mag.position.set(0.24, -0.1, 0)
  gun.add(mag)
  const sight = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.03), gunMetal))
  sight.position.set(0.3, 0.08, 0)
  gun.add(sight)
  return gun
}

/** Player — human tactical operative. */
export function createSoldier(): THREE.Group {
  const g = new THREE.Group()
  addHumanoid(g, {
    skin: 0xc4a484,
    shirt: 0x4a5c3a,
    pants: 0x3a4a32,
    armor: 0x3a3f38,
    boot: 0x1a1a18,
    hair: 0x2a1e14,
    helmet: true,
  })

  const gun = makeRifle()
  gun.position.set(0.28, 1.0, 0.18)
  g.add(gun)
  g.userData.gun = gun
  return g
}

/** Enemy infantry — clearly human hostile soldiers. */
export function createGrunt(): THREE.Group {
  const g = new THREE.Group()
  addHumanoid(g, {
    skin: 0xb8956c,
    shirt: 0x5c4030,
    pants: 0x4a3228,
    armor: 0x4a3020,
    boot: 0x221810,
    hair: 0x1a1210,
    helmet: true,
    mask: true,
    enemyTint: true,
  }, 0.98)

  // face them left (toward player approach)
  g.rotation.y = Math.PI

  const gun = makeRifle()
  gun.position.set(0.28, 1.0, 0.18)
  gun.scale.x = -1
  gun.position.x = -0.28
  g.add(gun)
  return g
}

/** Flying jetpack trooper — human with thruster pack. */
export function createFlyer(): THREE.Group {
  const g = new THREE.Group()
  addHumanoid(g, {
    skin: 0xc2a078,
    shirt: 0x4a4e52,
    pants: 0x3a3e42,
    armor: 0x5a5e62,
    boot: 0x222,
    hair: 0x1a1a1a,
    helmet: true,
    mask: true,
    enemyTint: true,
  }, 0.92)

  g.rotation.y = Math.PI

  const pack = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.4, 0.18), pbr(0x3a3e42, { map: TEX.metal, metalness: 0.7, roughness: 0.35 })))
  pack.position.set(0, 1.2, -0.22)
  g.add(pack)
  for (const sx of [-0.08, 0.08]) {
    const nozzle = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.12, 8), pbr(0x222, { metalness: 0.8, roughness: 0.3 })))
    nozzle.position.set(sx, 0.95, -0.28)
    g.add(nozzle)
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.2, 6),
      new THREE.MeshStandardMaterial({ color: 0xff6622, emissive: 0xff4400, emissiveIntensity: 1.3, transparent: true, opacity: 0.85 }),
    )
    flame.rotation.x = Math.PI
    flame.position.set(sx, 0.82, -0.28)
    g.add(flame)
  }

  const gun = makeRifle()
  gun.position.set(-0.28, 1.05, 0.15)
  gun.scale.x = -1
  g.add(gun)
  return g
}

/** Heavy trooper — bulky armored human. */
export function createHeavy(): THREE.Group {
  const g = new THREE.Group()
  addHumanoid(g, {
    skin: 0xa88868,
    shirt: 0x4a4e52,
    pants: 0x3a3e42,
    armor: 0x5a5e62,
    boot: 0x1a1a1a,
    hair: 0x111,
    helmet: true,
    mask: true,
    enemyTint: true,
  }, 1.12)

  g.rotation.y = Math.PI

  // extra shoulder plates
  for (const side of [-1, 1] as const) {
    const plate = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.28), pbr(0x6a6e72, { map: TEX.metal, metalness: 0.75, roughness: 0.35 })))
    plate.position.set(side * 0.32, 1.45, 0)
    g.add(plate)
  }

  const cannon = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.7, 10), pbr(0x2a2a2a, { metalness: 0.85, roughness: 0.3 })))
  cannon.rotation.z = Math.PI / 2
  cannon.position.set(-0.55, 1.05, 0.15)
  g.add(cannon)
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
  // visible human pilot silhouette in the cab
  const pilot = createGrunt()
  pilot.scale.setScalar(0.45)
  pilot.position.set(-0.25, 1.55, 0.15)
  pilot.rotation.y = 0
  g.add(pilot)
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
  // Mech with a humanoid armored frame
  const hull = pbr(0x2a2420, { map: TEX.metal, metalness: 0.75, roughness: 0.35 })
  const skin = pbr(0xa88868, { metalness: 0.05, roughness: 0.65 })

  const pelvis = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.7), hull))
  pelvis.position.y = 1.2
  g.add(pelvis)

  const torso = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 0.85), hull))
  torso.position.y = 2.1
  g.add(torso)

  const head = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), skin))
  head.position.y = 3.0
  g.add(head)
  const helm = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), hull))
  helm.scale.set(1.1, 0.75, 1.15)
  helm.position.y = 3.1
  g.add(helm)
  for (const side of [-1, 1] as const) {
    const eye = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({
      color: 0xff4422, emissive: 0xff2200, emissiveIntensity: 1.2,
    })))
    eye.position.set(side * 0.12, 3.0, 0.32)
    g.add(eye)
  }

  for (const side of [-1, 1] as const) {
    const thigh = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.7, 6, 10), hull))
    thigh.position.set(side * 0.35, 0.7, 0)
    g.add(thigh)
    const boot = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.6), hull))
    boot.position.set(side * 0.35, 0.15, 0.1)
    g.add(boot)
    const arm = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.9, 6, 10), hull))
    arm.position.set(side * 0.95, 2.0, 0.1)
    arm.rotation.z = side * 0.4
    g.add(arm)
    const fist = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), hull))
    fist.position.set(side * 1.35, 1.4, 0.2)
    g.add(fist)
  }

  const reactor = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0xff6600, emissiveIntensity: 1.5, metalness: 0.3, roughness: 0.25 }),
  )
  reactor.position.set(0, 2.1, 0.5)
  g.add(reactor)
  g.userData.core = torso
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
