// Records a walkthrough video of the deck: clicks through every slide and
// animation step with reading pauses, captures frames via the Chrome DevTools
// screencast and encodes them to an H.264 MP4 with ffmpeg.
//
//   npm run video            -> video/context-propagation.mp4
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'

const ROOT = resolve(import.meta.dirname, '..')
const OUT = join(ROOT, 'video', 'context-propagation.mp4')
const FRAMES = join(ROOT, 'video', '.frames')
const PORT = 3037
const W = 1920
const H = 1080

// Per slide: how long to stay after entering, then how long to stay after each click.
// Tuned for reading time: longer pauses after clicks that add text or finish a diagram.
const PLAN = {
  1: { enter: 6000 },
  2: { enter: 4000, clicks: [3000, 4000, 4500, 6000] },
  3: { enter: 11000 },
  4: { enter: 2500, clicks: [3500, 3500, 3500, 3500, 4500, 5000] },
  5: { enter: 3500 },
  6: { enter: 6500, clicks: [4500, 4500, 4500, 5500] },
  7: { enter: 11000, clicks: [8000] },
  8: { enter: 3500 },
  9: { enter: 3500, clicks: [4500, 3500, 4500, 6000] },
  10: { enter: 3000, clicks: [3500, 4500, 4500, 8000] },
  11: { enter: 3000, clicks: [3500, 4000, 4000, 4000, 6500] },
  12: { enter: 14000 },
  13: { enter: 13000 },
  14: { enter: 4000, clicks: [7000, 9000] },
  15: { enter: 3500, clicks: [4000, 3500, 5000, 6500] },
  16: { enter: 3000, clicks: [3500, 4500, 5500, 6000] },
  17: { enter: 2000, clicks: [5000, 5000, 5000, 5000, 7000] },
  18: { enter: 11000 },
  19: { enter: 7000 },
  20: { enter: 9000 },
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function waitForServer(url, timeout = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      if ((await fetch(url)).ok)
        return
    }
    catch {}
    await sleep(500)
  }
  throw new Error(`dev server did not come up at ${url}`)
}

rmSync(FRAMES, { recursive: true, force: true })
mkdirSync(FRAMES, { recursive: true })

const server = spawn('npx', ['slidev', '--port', String(PORT)], { cwd: ROOT, stdio: 'ignore', detached: true })
const stopServer = () => {
  try {
    process.kill(-server.pid)
  }
  catch {}
}
process.on('exit', stopServer)

try {
  await waitForServer(`http://localhost:${PORT}/1`)

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })

  // warm-up pass so Vite has compiled every slide before we record anything
  await page.goto(`http://localhost:${PORT}/1`, { waitUntil: 'networkidle' })
  for (let n = 2; n <= 20; n++)
    await page.goto(`http://localhost:${PORT}/${n}`, { waitUntil: 'networkidle' })

  const cdp = await page.context().newCDPSession(page)
  const frames = []
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = join(FRAMES, `f${String(frames.length).padStart(6, '0')}.jpg`)
    frames.push({ file, ts: metadata.timestamp })
    writeFileSync(file, Buffer.from(data, 'base64'))
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: W, maxHeight: H })

  await page.goto(`http://localhost:${PORT}/1`)
  await page.waitForSelector('.otel-cover svg g')
  const startTs = Date.now() / 1000

  const slideNo = () => Number(new URL(page.url()).pathname.split('/').filter(Boolean)[0] ?? 1)

  for (let n = 1; n <= 20; n++) {
    const { enter, clicks = [] } = PLAN[n]
    if (slideNo() !== n)
      console.warn(`expected slide ${n}, but on ${slideNo()}`)
    console.log(`slide ${n}`)
    await sleep(enter)
    for (const d of clicks) {
      await page.keyboard.press('ArrowRight')
      await sleep(d)
    }
    if (n < 19)
      await page.keyboard.press('ArrowRight')
  }

  const endTs = Date.now() / 1000
  await cdp.send('Page.stopScreencast')
  await browser.close()

  // build an ffmpeg concat list with each frame's real on-screen duration
  const used = frames.filter((f, i) => f.ts >= startTs || frames[i + 1]?.ts > startTs)
  let list = ''
  used.forEach((f, i) => {
    const from = Math.max(f.ts, startTs)
    const to = used[i + 1]?.ts ?? endTs
    list += `file '${f.file}'\nduration ${Math.max(to - from, 0.001).toFixed(4)}\n`
  })
  list += `file '${used.at(-1).file}'\n`
  const listFile = join(FRAMES, 'list.txt')
  writeFileSync(listFile, list)

  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-vf', `fps=30,scale=${W}:${H}:flags=lanczos,format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-tune', 'stillimage',
    '-movflags', '+faststart',
    OUT,
  ], { stdio: 'inherit' })

  rmSync(FRAMES, { recursive: true, force: true })
  console.log(`wrote ${OUT} (${(endTs - startTs).toFixed(1)}s, ${used.length} captured frames)`)
}
finally {
  stopServer()
}
