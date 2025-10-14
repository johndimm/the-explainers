const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

// Usage: node scripts/generate-android-custom-icon.js [sourcePath]
// If no sourcePath provided, tries these defaults (first match wins):
//   public/icons/custom-app-icon.png
//   public/icons/shakespeare-ai.png
//   public/icons/romeo-and-juliet-icon-512x512.png

function parseArgs(argv) {
  const out = {}
  for (const a of argv.slice(2)) {
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=')
      out[k] = v === undefined ? true : v
    } else if (!out._) {
      out._ = [a]
    } else {
      out._.push(a)
    }
  }
  return out
}

async function main() {
  const args = parseArgs(process.argv)
  const fromArg = (args._ && args._[0]) || args.src
  const scale = Math.max(0.6, Math.min(1.0, parseFloat(args.scale || '0.86'))) // content scale inside safe area
  const offsetX = parseFloat(args.offsetX || '0') // fraction of size, -0.1..0.1
  const offsetY = parseFloat(args.offsetY || '0')
  const bright = parseFloat(args.bright || '1')
  const sat = parseFloat(args.sat || '1')
  const cropTop = Math.max(0, Math.min(0.9, parseFloat(args.cropTop || '0')))
  const cropBottom = Math.max(0, Math.min(0.9, parseFloat(args.cropBottom || '0')))
  // Optional crop box: fractions of original image (0..1).
  const cropX = args.cropX != null ? Math.max(0, Math.min(0.99, parseFloat(args.cropX))) : null
  const cropY = args.cropY != null ? Math.max(0, Math.min(0.99, parseFloat(args.cropY))) : null
  const cropW = args.cropW != null ? Math.max(0.01, Math.min(1, parseFloat(args.cropW))) : null
  const cropH = args.cropH != null ? Math.max(0.01, Math.min(1, parseFloat(args.cropH))) : null
  const label = args.label || '' // e.g. AI
  const labelColor = args.labelColor || '#F5D5BE'
  const labelShadow = args.labelShadow || 'rgba(0,0,0,0.45)'
  const fit = (args.fit || 'cover') // cover|contain
  const candidates = [
    fromArg,
    'public/icons/Romeo and Juliet Explained.jpg',
    'public/icons/Romeo and Juliet Icon Explained.png',
    'public/icons/custom-app-icon.png',
    'public/icons/shakespeare-ai.png',
    'public/icons/romeo-and-juliet-icon-512x512.png',
  ].filter(Boolean)

  let src = null
  for (const c of candidates) {
    const p = path.join(process.cwd(), c)
    if (fs.existsSync(p)) { src = p; break }
  }
  if (!src) {
    console.error('❌ No source icon found. Provide a PNG or place one at public/icons/custom-app-icon.png')
    process.exit(1)
  }

  const androidResDir = path.join(process.cwd(), 'android/app/src/main/res')
  const sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
  }

  console.log(`🎨 Using source: ${src}`)

  // Generate Android foregrounds
  for (const [dir, size] of Object.entries(sizes)) {
    const outPng = path.join(androidResDir, dir, 'ic_launcher_foreground.png')
    const contentSize = Math.round(size * scale)
    // Optional crop to remove text or focus the subject
    let base = sharp(src)
    if (cropX !== null || cropY !== null || cropW !== null || cropH !== null) {
      const meta = await base.metadata()
      const w = meta.width || 0
      const h = meta.height || 0
      const left = Math.round((cropX || 0) * w)
      const top = Math.round((cropY || 0) * h)
      const width = Math.max(1, Math.round((cropW || 1) * w))
      const height = Math.max(1, Math.round((cropH || 1) * h))
      base = base.extract({ left, top, width: Math.min(w - left, width), height: Math.min(h - top, height) })
    } else if (cropTop > 0 || cropBottom > 0) {
      const meta = await base.metadata()
      const w = meta.width || 0
      const h = meta.height || 0
      const top = Math.round(h * cropTop)
      const height = Math.max(1, Math.round(h * (1 - cropTop - cropBottom)))
      base = base.extract({ left: 0, top, width: w, height })
    }

    let pipeline = base.resize(contentSize, contentSize, { fit })
    if (bright !== 1 || sat !== 1) pipeline = pipeline.modulate({ brightness: bright, saturation: sat })
    const content = await pipeline.png().toBuffer()

    // optional soft halo behind content to lift visibility on dark backgrounds
    const haloSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="50%" cy="55%" r="60%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0.10" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="${size}" height="${size}" fill="url(#g)" />
</svg>`)

    const baseLeft = Math.round((size - contentSize) / 2 + offsetX * size)
    const baseTop = Math.round((size - contentSize) / 2 + offsetY * size)
    const composites = [
      { input: haloSvg },
      { input: content, top: baseTop, left: baseLeft }
    ]

    if (label) {
      const margin = Math.round(size * 0.08)
      const fontSize = Math.round(size * 0.34)
      const svg = (fill, dx = 0, dy = 0) => Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <text x="${size - margin + dx}" y="${size - margin + dy}" font-family="ui-serif, Georgia, serif" font-weight="700" font-size="${fontSize}" fill="${fill}" text-anchor="end" dominant-baseline="ideographic">${label}</text>
</svg>`)
      // Shadow
      composites.push({ input: svg(labelShadow, 1, 1) })
      // Foreground text
      composites.push({ input: svg(label) })
    }

    await sharp({ create: { width: size, height: size, channels: 4, background: { r:0, g:0, b:0, alpha:0 } } })
      .png()
      .composite(composites)
      .toFile(outPng)
    console.log(`✅ Wrote ${outPng}`)
  }

  // Generate PWA icons (maskable friendly with padding)
  const publicIcons = path.join(process.cwd(), 'public/icons')
  if (!fs.existsSync(publicIcons)) fs.mkdirSync(publicIcons, { recursive: true })

  await sharp(src).resize(192, 192, { fit, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(publicIcons, 'icon-192x192.png'))
  await sharp(src).resize(512, 512, { fit, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(publicIcons, 'icon-512x512.png'))
  console.log('✅ Wrote public/icons/icon-192x192.png and icon-512x512.png')

  console.log('\nDone. Rebuild the APK or refresh the preview at /icon-preview')
}

main().catch(err => { console.error(err); process.exit(1) })
