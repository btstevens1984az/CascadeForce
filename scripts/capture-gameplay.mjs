/**
 * Capture live 5s gameplay loops for the GitHub README.
 * Starts recording only after the action scene is loaded.
 */
import { chromium } from 'playwright'
import { mkdir, readdir, unlink, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const media = path.join(root, 'media')
const tmp = path.join(media, '_raw')

const SCENES = [
  { id: '01-title', label: 'Title screen', action: 'title' },
  { id: '02-live-combat', label: 'Pulse rifle combat', action: 'combat' },
  { id: '03-hyper-spread', label: 'Hyper Spread shredding ranks', action: 'spread' },
  { id: '04-duck-dodge', label: 'Duck under chest-height fire', action: 'duck' },
  { id: '05-aim-skyward', label: 'Aim up — plasma vs flyers', action: 'aimup' },
  { id: '06-midboss-clash', label: 'Mid-boss clash', action: 'midboss' },
  { id: '07-inferno-push', label: 'Inferno Thrower push', action: 'inferno' },
]

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' })
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))))
  })
}

async function toGifAndMp4(webmPath, outBase) {
  const mp4 = `${outBase}.mp4`
  const gif = `${outBase}.gif`
  await run('ffmpeg', [
    '-y', '-i', webmPath,
    '-t', '5',
    '-vf', 'fps=20,scale=960:-2:flags=lanczos',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an',
    '-movflags', '+faststart',
    mp4,
  ])
  const palette = path.join(tmp, 'palette.png')
  await run('ffmpeg', [
    '-y', '-i', mp4,
    '-vf', 'fps=16,scale=720:-1:flags=lanczos,palettegen=stats_mode=diff',
    palette,
  ])
  await run('ffmpeg', [
    '-y', '-i', mp4, '-i', palette,
    '-lavfi', 'fps=16,scale=720:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5',
    '-loop', '0',
    gif,
  ])
}

async function mashKeys(page, action, ms) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    if (action === 'duck') {
      await page.keyboard.down('KeyS')
      await page.keyboard.down('KeyJ')
      await page.waitForTimeout(450)
      await page.keyboard.up('KeyS')
      await page.keyboard.down('KeyD')
      await page.waitForTimeout(300)
      await page.keyboard.up('KeyD')
    } else if (action === 'aimup') {
      await page.keyboard.down('KeyW')
      await page.keyboard.down('KeyJ')
      await page.keyboard.down('KeyD')
      await page.waitForTimeout(450)
      await page.keyboard.up('KeyD')
      await page.keyboard.down('KeyA')
      await page.waitForTimeout(350)
      await page.keyboard.up('KeyA')
    } else if (action === 'midboss') {
      await page.keyboard.down('KeyJ')
      await page.keyboard.down('KeyD')
      await page.waitForTimeout(280)
      await page.keyboard.press('Space')
      await page.waitForTimeout(350)
      await page.keyboard.up('KeyD')
      await page.keyboard.down('KeyA')
      await page.waitForTimeout(300)
      await page.keyboard.up('KeyA')
    } else if (action === 'title') {
      await page.waitForTimeout(500)
    } else {
      await page.keyboard.down('KeyJ')
      await page.keyboard.down('KeyD')
      await page.waitForTimeout(260)
      await page.keyboard.press('Space')
      await page.waitForTimeout(220)
      await page.keyboard.up('KeyD')
      await page.keyboard.down('KeyA')
      await page.waitForTimeout(240)
      await page.keyboard.up('KeyA')
      if (action === 'spread' || action === 'inferno') {
        await page.keyboard.down('KeyW')
        await page.waitForTimeout(180)
        await page.keyboard.up('KeyW')
      }
    }
  }
  for (const k of ['KeyJ', 'KeyW', 'KeyS', 'KeyA', 'KeyD']) {
    await page.keyboard.up(k)
  }
}

async function main() {
  await mkdir(media, { recursive: true })
  await rm(tmp, { recursive: true, force: true })
  await mkdir(tmp, { recursive: true })

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ],
  })

  for (const clip of SCENES) {
    console.log(`\n▶ Capturing ${clip.id} — ${clip.label}`)

    // Warm page first (no recording) so WebGL + scene are ready
    const warm = await browser.newContext({ viewport: { width: 1280, height: 720 } })
    const warmPage = await warm.newPage()
    await warmPage.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle', timeout: 60000 })
    await warmPage.waitForFunction(() => !!window.cascadeForce)
    await warmPage.waitForTimeout(600)

    if (clip.action !== 'title') {
      await warmPage.evaluate((s) => {
        document.getElementById('title')?.classList.add('hidden')
        document.getElementById('story')?.classList.add('hidden')
        document.getElementById('overlay')?.classList.add('hidden')
        window.cascadeForce.prepareCapture(s)
      }, clip.action)
      await warmPage.waitForTimeout(500)
      // Verify play mode
      const mode = await warmPage.evaluate(() => window.cascadeForce.mode)
      const enemies = await warmPage.evaluate(() => window.cascadeForce.enemies.length)
      console.log(`  warm mode=${mode} enemies=${enemies}`)
    }
    await warmPage.close()
    await warm.close()

    // Fresh context WITH recording — jump straight into scene
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: tmp, size: { width: 1280, height: 720 } },
    })
    const page = await context.newPage()
    await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForFunction(() => !!window.cascadeForce)
    await page.waitForTimeout(400)

    if (clip.action === 'title') {
      await page.screenshot({ path: path.join(media, `${clip.id}.png`), type: 'png' })
      await mashKeys(page, 'title', 5200)
    } else {
      await page.evaluate((s) => {
        document.getElementById('title')?.classList.add('hidden')
        document.getElementById('story')?.classList.add('hidden')
        document.getElementById('overlay')?.classList.add('hidden')
        window.cascadeForce.prepareCapture(s)
      }, clip.action)
      await page.waitForTimeout(350)
      // Hold fire briefly then still
      await page.keyboard.down('KeyJ')
      await page.waitForTimeout(400)
      await page.screenshot({ path: path.join(media, `${clip.id}.png`), type: 'png' })
      await mashKeys(page, clip.action, 4800)
    }

    await page.close()
    const video = await context.close()
    // context.close returns void; video path is in tmp
    await new Promise((r) => setTimeout(r, 300))

    const files = (await readdir(tmp)).filter((f) => f.endsWith('.webm'))
    if (!files.length) throw new Error(`No webm for ${clip.id}`)
    // newest webm
    const webms = await Promise.all(
      files.map(async (f) => {
        const p = path.join(tmp, f)
        const { statSync } = await import('node:fs')
        return { p, m: statSync(p).mtimeMs }
      }),
    )
    webms.sort((a, b) => b.m - a.m)
    const webm = webms[0].p
    const staged = path.join(tmp, `${clip.id}.webm`)
    const { renameSync, copyFileSync } = await import('node:fs')
    try {
      renameSync(webm, staged)
    } catch {
      copyFileSync(webm, staged)
    }
    await toGifAndMp4(staged, path.join(media, clip.id))
    // keep the live screenshot taken mid-action (already written)
    console.log(`✓ Saved media/${clip.id}.{gif,mp4,png}`)

    // clear webms for next
    for (const f of await readdir(tmp)) {
      if (f.endsWith('.webm') || f === 'palette.png') await unlink(path.join(tmp, f)).catch(() => {})
    }
  }

  await browser.close()
  await rm(tmp, { recursive: true, force: true })
  console.log('\nAll live gameplay loops ready in media/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
