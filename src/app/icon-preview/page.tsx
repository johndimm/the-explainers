import fs from 'fs'
import path from 'path'

export default function IconPreview() {
  const bg = '#7A1F2B'
  const shapes = [
    { name: 'Circle', radius: '50%' },
    { name: 'Squircle', radius: '28px' },
    { name: 'Rounded Square', radius: '18px' },
  ]

  // Read the generated hdpi foreground from Android mipmaps
  let dataUrl = ''
  try {
    const p = path.join(process.cwd(), 'android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png')
    const buf = fs.readFileSync(p)
    const b64 = buf.toString('base64')
    dataUrl = `data:image/png;base64,${b64}`
  } catch (e) {
    // fallback to text mark if file missing
    dataUrl = ''
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', padding: 24 }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>Romeo & Juliet Icon Preview</h1>
      <p style={{ marginTop: 0, color: '#555' }}>
        Live preview using the generated Android foreground PNG over the adaptive dark red background.
      </p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {shapes.map((s) => (
          <div key={s.name} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 120,
                height: 120,
                background: bg,
                borderRadius: s.radius as any,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(0,0,0,0.25) inset, 0 2px 8px rgba(0,0,0,0.15)',
                overflow: 'hidden',
              }}
            >
              {dataUrl ? (
                <img src={dataUrl} alt="Foreground" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ color: '#fff' }}>Missing PNG</span>
              )}
            </div>
            <div style={{ marginTop: 8, color: '#666' }}>{s.name}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, color: '#444' }}>
        <div><strong>Background:</strong> {bg}</div>
        <div><strong>Foreground:</strong> android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png</div>
      </div>
    </div>
  )
}
// Allow static export by letting Next.js decide automatically
export const dynamic = 'auto'
