import { figureSrc } from './figure.js'
import { label } from './tags.js'

export const FORMATS = { portrait: [1080, 1350], linkedin: [1200, 627] }

export async function drawCard({ name, avatar, tags, circles, format }) {
  const [W, H] = FORMATS[format]
  const canvas = Object.assign(document.createElement('canvas'), { width: W, height: H })
  const x = canvas.getContext('2d')
  const img = new Image()
  img.src = figureSrc(avatar)
  await Promise.all([img.decode(), document.fonts.load('800 60px Mona'), document.fonts.load('500 30px Mona')])

  const bg = x.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#2a3770')
  bg.addColorStop(1, '#0f1428')
  x.fillStyle = bg
  x.fillRect(0, 0, W, H)
  x.strokeStyle = '#cfd3da'
  x.lineWidth = 16
  x.strokeRect(24, 24, W - 48, H - 48)

  const wide = format === 'linkedin'
  const fh = wide ? 520 : 720
  const fw = (fh * 560) / 660
  x.drawImage(img, wide ? 60 : (W - fw) / 2, wide ? 54 : 60, fw, fh)

  const cx = wide ? 850 : W / 2
  const y = wide ? 170 : 880
  const max = wide ? 600 : 940
  x.textAlign = 'center'
  const text = (value, dy, size, color = '#fff', weight = 500) => {
    x.fillStyle = color
    x.font = `${weight} ${size}px Mona, sans-serif`
    x.fillText(value, cx, y + dy, max)
  }
  text(name, 0, 76, '#fff', 800)
  text(tags.map(label).join('  ·  '), 76, 36, '#c8f000', 700)
  const words = (avatar.tagline || '').split(' ')
  const lines = ['']
  for (const w of words) {
    if (x.measureText(`${lines.at(-1)} ${w}`).width > max * 0.7 && lines.at(-1)) lines.push(w)
    else lines[lines.length - 1] = `${lines.at(-1)} ${w}`.trim()
  }
  lines.forEach((line, i) => text(line, 150 + i * 44, 32))
  text(circles.length ? `Reconhecido por: ${circles.join(', ')}` : '', 300, 26, '#9aa6d1')
  text('MIGHT · eu, pelos olhos dos outros', wide ? 380 : 380, 24, '#1fb5d4', 700)
  return canvas.toDataURL('image/png')
}
