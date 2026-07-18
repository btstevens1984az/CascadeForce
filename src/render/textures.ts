import * as THREE from 'three'

/** Canvas noise textures for more realistic PBR surfaces. */
function noiseTexture(size: number, fn: (x: number, y: number, rnd: () => number) => [number, number, number]) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(size, size)
  let s = 1
  const rnd = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = fn(x, y, rnd)
      const i = (y * size + x) * 4
      img.data[i] = r
      img.data[i + 1] = g
      img.data[i + 2] = b
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export const TEX = {
  dirt: noiseTexture(128, (_x, _y, rnd) => {
    const n = 40 + rnd() * 50
    return [n + 20, n + 12, n * 0.55]
  }),
  grass: noiseTexture(128, (_x, _y, rnd) => {
    const n = rnd()
    return [30 + n * 40, 70 + n * 70, 25 + n * 20]
  }),
  rock: noiseTexture(128, (_x, _y, rnd) => {
    const n = 70 + rnd() * 60
    return [n, n * 0.95, n * 0.9]
  }),
  metal: noiseTexture(64, (_x, _y, rnd) => {
    const n = 90 + rnd() * 50
    return [n, n + 4, n + 8]
  }),
  bark: noiseTexture(64, (x, _y, rnd) => {
    const n = 45 + rnd() * 35 + (x % 8) * 2
    return [n + 15, n * 0.7, n * 0.4]
  }),
  concrete: noiseTexture(128, (_x, _y, rnd) => {
    const n = 95 + rnd() * 40
    return [n, n * 0.98, n * 0.92]
  }),
}

export function pbr(
  color: number,
  opts: { map?: THREE.Texture; metalness?: number; roughness?: number; emissive?: number; emissiveIntensity?: number; repeat?: number } = {},
) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    map: opts.map,
    metalness: opts.metalness ?? 0.25,
    roughness: opts.roughness ?? 0.75,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  })
  if (opts.map && opts.repeat) {
    opts.map.repeat.set(opts.repeat, opts.repeat)
  }
  return mat
}

function shadow(mesh: THREE.Mesh) {
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}
