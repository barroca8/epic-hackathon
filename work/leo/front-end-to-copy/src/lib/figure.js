// Image URL for an avatar: the artwork when `art` is set, otherwise an SVG built
// from the colors and patterns the backend returns (head, body, arms).
const SHAPES = {
  arms: 'M24 66 L12 104 Q11 112 18 111 L28 108 Z M76 66 L88 104 Q89 112 82 111 L72 108 Z',
  body: 'M26 64 L74 64 L69 110 Q68 117 61 116 Q56 115 56 108 Q50 101 44 108 Q44 115 39 116 Q32 117 31 110 Z',
  head: 'M50 6 C70 6 80 17 82 28 C92 29 97 36 97 43 C97 51 90 56 82 56 C76 67 63 71 50 71 C37 71 24 67 18 56 C10 56 3 51 3 43 C3 36 8 29 18 28 C20 17 30 6 50 6 Z',
}

const MARKS = {
  stripes: '<rect width="10" height="4" fill="#fff"/>',
  dots: '<circle cx="5" cy="5" r="2.2" fill="#fff"/>',
  zigzag: '<path d="M0 7L2.5 3L5 7L7.5 3L10 7" stroke="#fff" stroke-width="1.5" fill="none"/>',
  grid: '<path d="M0 0H10M0 0V10" stroke="#fff" stroke-width="1.5"/>',
  waves: '<path d="M0 5Q2.5 1 5 5T10 5" stroke="#fff" stroke-width="1.5" fill="none"/>',
  checker: '<path d="M0 0H5V5H0ZM5 5H10V10H5Z" fill="#fff"/>',
  triangles: '<path d="M5 2L8 8H2Z" fill="#fff"/>',
}

export function figureSvg(parts = {}) {
  const defs = []
  const paths = ['arms', 'body', 'head'].map((name) => {
    const p = parts[name]
    const color = p?.color ?? '#46507e'
    let fill = color
    if (MARKS[p?.pattern]) {
      defs.push(`<pattern id="${name}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${color}"/><g opacity=".6">${MARKS[p.pattern]}</g></pattern>`)
      fill = `url(#${name})`
    }
    return `<path d="${SHAPES[name]}" fill="${fill}" stroke="#0f1428" stroke-width="1.5"/>`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="560" height="672"><defs>${defs.join('')}</defs>${paths.join('')}</svg>`
}

export const figureSrc = (avatar) =>
  avatar?.art ? `figures/${avatar.art}.webp` : `data:image/svg+xml,${encodeURIComponent(figureSvg(avatar || {}))}`
