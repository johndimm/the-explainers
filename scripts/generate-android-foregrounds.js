const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

// Generates transparent foregrounds that suggest Shakespeare + Romeo & Juliet:
// crossed quills, a heart, and a small balcony silhouette. Foreground is
// opaque white so it sits cleanly on the adaptive dark-red background.
async function generate() {
  const androidResDir = path.join(__dirname, '../android/app/src/main/res')
  const sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
  }

  for (const [dir, size] of Object.entries(sizes)) {
    const cx = size / 2
    const cy = size * 0.54
    const heartW = size * 0.42
    const heartH = size * 0.35
    const featherLen = size * 0.70
    const featherW = size * 0.10
    const stroke = Math.max(1, Math.round(size * 0.02))

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Transparent background: adaptive icon background supplies color -->
  <rect x="0" y="0" width="${size}" height="${size}" fill="transparent" />

  <!-- Crossed quills (Shakespeare) -->
  <g transform="translate(${cx}, ${cy - size * 0.12})" filter="url(#s)" fill="#FFFFFF">
    <!-- Left quill -->
    <g transform="rotate(-35)">
      <path d="M0 ${-featherLen * 0.35} C ${-featherW} ${-featherLen * 0.25}, ${-featherW} ${-featherLen * 0.10}, 0 ${featherLen * 0.05}
               C ${featherW} ${featherLen * 0.10}, ${featherW} ${featherLen * 0.18}, 0 ${featherLen * 0.22} Z" />
      <rect x="-${stroke/2}" y="${featherLen * 0.18}" width="${stroke}" height="${size*0.08}" rx="${stroke/2}" />
    </g>

    <!-- Right quill -->
    <g transform="rotate(35)">
      <path d="M0 ${-featherLen * 0.35} C ${-featherW} ${-featherLen * 0.25}, ${-featherW} ${-featherLen * 0.10}, 0 ${featherLen * 0.05}
               C ${featherW} ${featherLen * 0.10}, ${featherW} ${featherLen * 0.18}, 0 ${featherLen * 0.22} Z" />
      <rect x="-${stroke/2}" y="${featherLen * 0.18}" width="${stroke}" height="${size*0.08}" rx="${stroke/2}" />
    </g>
  </g>

  <!-- Heart (Romeo & Juliet) -->
  <g filter="url(#s)">
    <path fill="#FFFFFF" d="
      M ${cx} ${cy}
      C ${cx - heartW*0.40} ${cy - heartH*0.60}, ${cx - heartW*0.90} ${cy - heartH*0.05}, ${cx} ${cy + heartH*0.55}
      C ${cx + heartW*0.90} ${cy - heartH*0.05}, ${cx + heartW*0.40} ${cy - heartH*0.60}, ${cx} ${cy}
      Z"/>
  </g>

  <!-- Balcony silhouette (subtle) -->
  <g fill="#FFFFFF" opacity="0.92" filter="url(#s)">
    <rect x="${cx - size*0.22}" y="${cy + heartH*0.55}" width="${size*0.44}" height="${size*0.06}" rx="${size*0.02}" />
    ${[...Array(5)].map((_, i) => {
      const gap = (size*0.44 - 5*(size*0.05)) / 4;
      const x = cx - size*0.22 + i*(size*0.05 + gap);
      return `<rect x="${x.toFixed(2)}" y="${(cy + heartH*0.61).toFixed(2)}" width="${(size*0.05).toFixed(2)}" height="${(size*0.09).toFixed(2)}" rx="${(size*0.015).toFixed(2)}" />`;
    }).join('')}
  </g>

  <!-- Simple AI motif: neural node cluster (top-right) -->
  <g fill="#FFFFFF" opacity="0.95" filter="url(#s)">
    ${(() => {
      const nodes = []
      const r = Math.max(1, size*0.02)
      const ox = cx + size*0.20
      const oy = cy - size*0.58
      const pts = [
        [ox, oy],
        [ox - size*0.08, oy + size*0.04],
        [ox + size*0.02, oy + size*0.07],
        [ox - size*0.05, oy + size*0.12],
        [ox + size*0.06, oy + size*0.13]
      ]
      // lines
      for (let i=0;i<pts.length-1;i++) {
        const [x1,y1] = pts[i]
        const [x2,y2] = pts[i+1]
        nodes.push(`<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}" stroke="#FFFFFF" stroke-width="${(r*0.9).toFixed(2)}" fill="none" stroke-linecap="round"/>`)
      }
      // dots
      for (const [x,y] of pts) {
        nodes.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" />`)
      }
      return nodes.join('')
    })()}
  </g>
</svg>`

    const outPng = path.join(androidResDir, dir, 'ic_launcher_foreground.png')
    const png = await sharp(Buffer.from(svg)).png().toBuffer()
    fs.writeFileSync(outPng, png)
    console.log(`Wrote ${outPng}`)
  }
}

generate().catch(err => {
  console.error(err)
  process.exit(1)
})
