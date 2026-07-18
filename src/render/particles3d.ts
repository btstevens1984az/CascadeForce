import * as THREE from 'three'

export type Burst = {
  mesh: THREE.Points
  life: number
  max: number
  vel: Float32Array
}

export class FxSystem {
  group = new THREE.Group()
  bursts: Burst[] = []

  explode(x: number, y: number, color: number, n = 28, speed = 6) {
    const positions = new Float32Array(n * 3)
    const vel = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4
      const a = Math.random() * Math.PI * 2
      const s = speed * (0.3 + Math.random())
      vel[i * 3] = Math.cos(a) * s
      vel[i * 3 + 1] = Math.sin(a) * s + 2
      vel[i * 3 + 2] = (Math.random() - 0.5) * s * 0.4
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color,
      size: 0.18,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const mesh = new THREE.Points(geo, mat)
    this.group.add(mesh)
    this.bursts.push({ mesh, life: 0.55, max: 0.55, vel })
  }

  update(dt: number) {
    const next: Burst[] = []
    for (const b of this.bursts) {
      b.life -= dt
      const pos = b.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        b.vel[i * 3 + 1]! -= 12 * dt
        pos.setX(i, pos.getX(i) + b.vel[i * 3]! * dt)
        pos.setY(i, pos.getY(i) + b.vel[i * 3 + 1]! * dt)
        pos.setZ(i, pos.getZ(i) + b.vel[i * 3 + 2]! * dt)
      }
      pos.needsUpdate = true
      const mat = b.mesh.material as THREE.PointsMaterial
      mat.opacity = Math.max(0, b.life / b.max)
      if (b.life > 0) next.push(b)
      else {
        this.group.remove(b.mesh)
        b.mesh.geometry.dispose()
        mat.dispose()
      }
    }
    this.bursts = next
  }

  clear() {
    for (const b of this.bursts) {
      this.group.remove(b.mesh)
      b.mesh.geometry.dispose()
      ;(b.mesh.material as THREE.Material).dispose()
    }
    this.bursts = []
  }
}
